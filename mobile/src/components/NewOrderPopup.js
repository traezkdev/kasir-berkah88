import React, { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
    StatusBar
} from 'react-native';
import { Bell, ShoppingBag, X, ArrowRight } from 'lucide-react-native';
import { useOrderNotification } from '../context/OrderNotificationContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const NewOrderPopup = () => {
    const { showPopup, newOrder, closePopup } = useOrderNotification();
    const navigation = useNavigation();

    // Animations
    const slideAnim = useRef(new Animated.Value(400)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const bellBounceAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (showPopup) {
            // Entrance
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    bounciness: 8
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true
                })
            ]).start();

            // Loop Animations
            startBellBounce();
            startPulse();
        }
    }, [showPopup]);

    // Time Ago calculation
    const [timeAgo, setTimeAgo] = useState('Baru saja masuk');

    useEffect(() => {
        if (showPopup && newOrder) {
            const updateTime = () => {
                const now = new Date();
                const createdAt = new Date(newOrder.created_at);
                const diffMs = now - createdAt;
                const diffMins = Math.floor(diffMs / 60000);

                if (diffMins < 1) {
                    setTimeAgo('Baru saja masuk');
                } else if (diffMins < 60) {
                    setTimeAgo(`${diffMins} menit yang lalu`);
                } else {
                    const diffHours = Math.floor(diffMins / 60);
                    setTimeAgo(`${diffHours} jam yang lalu`);
                }
            };

            updateTime();
            const interval = setInterval(updateTime, 30000); // Update every 30 seconds
            return () => clearInterval(interval);
        }
    }, [showPopup, newOrder]);

    const startBellBounce = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(bellBounceAnim, {
                    toValue: -5,
                    duration: 300,
                    useNativeDriver: true
                }),
                Animated.timing(bellBounceAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true
                })
            ])
        ).start();
    };

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.5,
                    duration: 1500,
                    useNativeDriver: true
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true
                })
            ])
        ).start();
    };

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 400,
                duration: 400,
                useNativeDriver: true
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            })
        ]).start(() => closePopup());
    };

    const handleCekPesanan = () => {
        handleClose();
        navigation.navigate('Pesanan');
    };

    if (!showPopup || !newOrder) return null;

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val || 0);
    };

    return (
        <Animated.View
            style={[
                styles.wrapper,
                {
                    transform: [{ translateY: slideAnim }],
                    opacity: opacityAnim
                }
            ]}
        >
            <View style={styles.container}>
                {/* Decorative Glows */}
                <Animated.View style={[styles.glowLeft, { transform: [{ scale: pulseAnim }] }]} />
                <Animated.View style={[styles.glowRight, { transform: [{ scale: pulseAnim }] }]} />

                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.bellContainer}>
                            <Animated.View style={{ transform: [{ translateY: bellBounceAnim }] }}>
                                <Bell size={20} color="#FFFFFF" fill="#FFFFFF" />
                            </Animated.View>
                        </View>
                        <View style={styles.headerText}>
                            <Text style={styles.title}>Pesanan Baru!</Text>
                            <Text style={styles.subtitle}>{timeAgo}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                        <X size={18} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                {/* Content Section */}
                <View style={styles.content}>
                    <View style={styles.infoRow}>
                        <View>
                            <Text style={styles.infoLabel}>NAMA PELANGGAN</Text>
                            <Text style={styles.infoValue}>{newOrder.customer_name || 'Pelanggan'}</Text>
                        </View>
                        <View style={styles.textRight}>
                            <Text style={styles.infoLabel}>TOTAL BAYAR</Text>
                            <Text style={styles.totalValue}>{formatCurrency(newOrder.total)}</Text>
                        </View>
                    </View>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.actionBtn}
                    onPress={handleCekPesanan}
                >
                    <ShoppingBag size={18} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>CEK PESANAN</Text>
                    <ArrowRight size={18} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 100 : 90,
        left: 20,
        right: 20,
        zIndex: 9999,
        elevation: 100,
    },
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#128EEA',
        padding: 16,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#128EEA',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 15,
            },
            android: {
                elevation: 10,
            },
            web: {
                boxShadow: '0px 20px 50px rgba(18, 142, 234, 0.3)'
            }
        })
    },
    glowLeft: {
        position: 'absolute',
        top: -40,
        left: -40,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        zIndex: -1,
    },
    glowRight: {
        position: 'absolute',
        bottom: -40,
        right: -40,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        zIndex: -1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    bellContainer: {
        width: 44,
        height: 44,
        backgroundColor: '#128EEA',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#128EEA',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: { elevation: 5 },
            web: { boxShadow: '0px 4px 10px rgba(18, 142, 234, 0.3)' }
        })
    },
    headerText: {
        gap: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    subtitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#94A3B8',
    },
    closeBtn: {
        padding: 5,
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
    },
    content: {
        backgroundColor: 'rgba(239, 246, 255, 0.6)',
        borderRadius: 18,
        padding: 14,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#128EEA',
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    textRight: {
        alignItems: 'flex-end',
    },
    totalValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#128EEA',
    },
    actionBtn: {
        backgroundColor: '#128EEA',
        height: 50,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    actionBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.5,
    }
});

export default NewOrderPopup;
