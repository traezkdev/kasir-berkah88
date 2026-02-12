import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Platform,
    Linking,
    Animated,
    Text,
} from 'react-native';
import { X, ExternalLink, ArrowRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../api/apiService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PopupModal = ({ popups = [], currentPage = 'dashboard', onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visible, setVisible] = useState(false);
    const [displayPopups, setDisplayPopups] = useState([]);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        loadAndFilterPopups();
    }, [popups, currentPage]);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.9);
        }
    }, [visible, currentIndex]);

    const loadAndFilterPopups = async () => {
        try {
            const closedPopupsJson = await AsyncStorage.getItem('closedPopups');
            const closedPopups = closedPopupsJson ? JSON.parse(closedPopupsJson) : {};

            const filtered = popups.filter(popup => {
                const closedAt = closedPopups[popup.id];
                if (closedAt) {
                    if (popup.last_pushed_at && new Date(popup.last_pushed_at) > new Date(closedAt)) {
                        return true;
                    }
                    return false;
                }
                return true;
            });

            setDisplayPopups(filtered);
            if (filtered.length > 0) {
                setVisible(true);
                trackView(filtered[0].id);
            }
        } catch (error) {
            console.error('Error loading closed popups:', error);
            setDisplayPopups(popups);
            if (popups.length > 0) {
                setVisible(true);
                trackView(popups[0].id);
            }
        }
    };

    const trackView = async (popupId) => {
        if (!popupId) return;
        try {
            await fetch(`${API_URL}/api/popups/${popupId}/view`, {
                method: 'POST',
            });
        } catch (error) {
            console.error('Error tracking view:', error);
        }
    };

    const trackClick = async (popupId) => {
        if (!popupId) return;
        try {
            await fetch(`${API_URL}/api/popups/${popupId}/click`, {
                method: 'POST',
            });
        } catch (error) {
            console.error('Error tracking click:', error);
        }
    };

    const handleClose = async () => {
        const currentPopup = displayPopups[currentIndex];
        if (!currentPopup) {
            setVisible(false);
            if (onClose) onClose();
            return;
        }

        try {
            const closedPopupsJson = await AsyncStorage.getItem('closedPopups');
            const closedPopups = closedPopupsJson ? JSON.parse(closedPopupsJson) : {};
            closedPopups[currentPopup.id] = new Date().toISOString();
            await AsyncStorage.setItem('closedPopups', JSON.stringify(closedPopups));
        } catch (error) {
            console.error('Error saving closed popup:', error);
        }

        // Animate out
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1.1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setVisible(false);
            if (currentIndex < displayPopups.length - 1) {
                setTimeout(() => {
                    const nextIndex = currentIndex + 1;
                    setCurrentIndex(nextIndex);
                    setVisible(true);
                    if (displayPopups[nextIndex]) {
                        trackView(displayPopups[nextIndex].id);
                    }
                }, 300);
            } else {
                if (onClose) onClose();
            }
        });
    };

    const handlePopupPress = async () => {
        const currentPopup = displayPopups[currentIndex];
        if (!currentPopup) return;

        await trackClick(currentPopup.id);

        if (currentPopup.link_type === 'url' && currentPopup.link_value) {
            try {
                await Linking.openURL(currentPopup.link_value);
            } catch (error) {
                console.error('Error opening URL:', error);
            }
        } else if (currentPopup.link_type === 'screen' && currentPopup.link_value) {
            if (onClose) onClose(currentPopup.link_value);
        }

        handleClose();
    };

    if (!visible || displayPopups.length === 0) {
        return null;
    }

    const currentPopup = displayPopups[currentIndex];
    if (!currentPopup) return null;

    const hasLink = currentPopup.link_type !== 'none';

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    {/* Glassmorphism Background Card */}
                    <View style={styles.contentCard}>
                        {/* Close Button - More Premium */}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleClose}
                            activeOpacity={0.8}
                        >
                            <View style={styles.closeButtonInner}>
                                <X size={20} color="#64748B" />
                            </View>
                        </TouchableOpacity>

                        {/* Popup Image with Inner Shadow/Border */}
                        <TouchableOpacity
                            activeOpacity={hasLink ? 0.9 : 1}
                            onPress={hasLink ? handlePopupPress : undefined}
                            style={styles.imageWrapper}
                        >
                            <Image
                                source={{ uri: `${API_URL}${currentPopup.image_url}` }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                            {hasLink && (
                                <View style={styles.imageOverlay}>
                                    <View style={styles.linkIndicator}>
                                        <ExternalLink size={16} color="#fff" />
                                    </View>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Call to Action Section if has link */}
                        {hasLink && (
                            <TouchableOpacity
                                style={styles.ctaButton}
                                onPress={handlePopupPress}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.ctaText}>Lihat Selengkapnya</Text>
                                <ArrowRight size={18} color="#fff" strokeWidth={3} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Badge/Priority Info (Subtle) */}
                    <View style={styles.footerInfo}>
                        <Text style={styles.footerText}>
                            Popup {currentIndex + 1} dari {displayPopups.length}
                        </Text>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.85)', // Slate 900 with high opacity
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: SCREEN_WIDTH * 0.88,
        maxWidth: 420,
        alignItems: 'center',
    },
    contentCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 8, // Outer spacing
        position: 'relative',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
            },
            android: {
                elevation: 15,
            },
        }),
    },
    closeButton: {
        position: 'absolute',
        top: -12,
        right: -12,
        zIndex: 100,
    },
    closeButtonInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    imageWrapper: {
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
        position: 'relative',
    },
    image: {
        width: '100%',
        aspectRatio: 0.85, // Premium portrait feel
        maxHeight: SCREEN_HEIGHT * 0.6,
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    linkIndicator: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 8,
        borderRadius: 10,
    },
    ctaButton: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#059669', // Brand green
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
        marginBottom: 8,
        marginHorizontal: 4,
    },
    ctaText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    footerInfo: {
        marginTop: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    footerText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
        opacity: 0.8,
    },
});

export default PopupModal;
