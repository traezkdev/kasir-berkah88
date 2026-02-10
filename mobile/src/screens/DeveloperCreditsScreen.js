import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
    StatusBar,
    ScrollView,
    Platform,
    Dimensions,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Github,
    Globe,
    Instagram,
    Mail,
    Code2,
    Cpu,
    Sparkles,
    Heart
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const DeveloperCreditsScreen = ({ navigation }) => {
    const handleOpenLink = (url) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Developer Credits</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Logo / Mascot Area */}
                <View style={styles.logoArea}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={{ width: 120, height: 120 }}
                        resizeMode="contain"
                    />
                    <Text style={styles.appName}>Kasir Berkah88</Text>
                    <Text style={styles.appVersion}>Versi 1.6.1 (Alpha)</Text>
                </View>

                {/* Developer Info Card */}
                <View style={styles.card}>
                    <View style={styles.cardInner}>
                        <View style={styles.devHeader}>
                            <View style={styles.sparkleWrap}>
                                <Sparkles size={20} color="#F59E0B" />
                            </View>
                            <Text style={styles.devLabel}>DIKEMBANGKAN OLEH</Text>
                        </View>

                        <Text style={styles.devName}>M Alfin Firdaus</Text>
                        <Text style={styles.studioName}>CEO & Lead Developer @ traezkdev</Text>

                        <View style={styles.divider} />

                        <View style={styles.descriptionBox}>
                            <Text style={styles.descriptionText}>
                                "Menciptakan solusi digital yang memudahkan bisnis UMKM di Indonesia melalui teknologi yang modern dan mudah digunakan."
                            </Text>
                        </View>

                        {/* Social Links */}
                        <View style={styles.socialGrid}>
                            <TouchableOpacity
                                style={[styles.socialBtn, { backgroundColor: '#F0F9FF' }]}
                                onPress={() => handleOpenLink('https://github.com/traezkdev')}
                            >
                                <Github size={20} color="#0369A1" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.socialBtn, { backgroundColor: '#FFF7ED' }]}
                                onPress={() => handleOpenLink('https://instagram.com/traezkdev')}
                            >
                                <Instagram size={20} color="#C2410C" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.socialBtn, { backgroundColor: '#ECFDF5' }]}
                                onPress={() => handleOpenLink('mailto:traezkdev@gmail.com')}
                            >
                                <Mail size={20} color="#059669" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.socialBtn, { backgroundColor: '#F5F3FF' }]}
                                onPress={() => handleOpenLink('https://traezkdev.com')}
                            >
                                <Globe size={20} color="#6D28D9" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Tech Stack Info */}
                <View style={[styles.card, { marginTop: 20 }]}>
                    <View style={styles.cardInner}>
                        <View style={styles.devHeader}>
                            <Cpu size={18} color="#138FEA" />
                            <Text style={styles.devLabel}>TECH STACK</Text>
                        </View>
                        <View style={styles.techGrid}>
                            <View style={styles.techTag}><Text style={styles.techTagText}>React Native</Text></View>
                            <View style={styles.techTag}><Text style={styles.techTagText}>Expo</Text></View>
                            <View style={styles.techTag}><Text style={styles.techTagText}>Node.js</Text></View>
                            <View style={styles.techTag}><Text style={styles.techTagText}>MySQL</Text></View>
                            <View style={styles.techTag}><Text style={styles.techTagText}>Express</Text></View>
                        </View>
                    </View>
                </View>

                {/* Footer Quote */}
                <View style={styles.footerWrap}>
                    <Heart size={16} color="#EF4444" fill="#EF4444" />
                    <Text style={styles.footerQuote}>Trz Kasir App</Text>
                    <Text style={styles.copyrightText}>© 2024-2026 traezkdev. All rights reserved.</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: 0.5,
    },
    scrollContent: {
        paddingHorizontal: 25,
    },
    logoArea: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 35,
        backgroundColor: '#138FEA',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#138FEA',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 15,
            },
            android: { elevation: 10 },
            web: { boxShadow: '0px 10px 20px rgba(19, 143, 234, 0.3)' }
        })
    },
    appName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1E293B',
        marginTop: 5,
    },
    appVersion: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94A3B8',
        marginTop: 5,
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#F8FAFC',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    cardInner: {
        padding: 25,
    },
    devHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 15,
    },
    sparkleWrap: {
        backgroundColor: '#FEF3C7',
        padding: 4,
        borderRadius: 8,
    },
    devLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 2,
    },
    devName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
    },
    studioName: {
        fontSize: 14,
        color: '#138FEA',
        fontWeight: 'bold',
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 20,
    },
    descriptionBox: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 20,
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#475569',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    socialGrid: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
    },
    socialBtn: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    techGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    techTag: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    techTagText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748B',
    },
    footerWrap: {
        alignItems: 'center',
        marginTop: 40,
        gap: 8,
    },
    footerQuote: {
        fontSize: 13,
        fontWeight: '900',
        color: '#1E293B',
    },
    copyrightText: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: 'bold',
    }
});

export default DeveloperCreditsScreen;
