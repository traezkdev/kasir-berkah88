import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Platform,
    Linking,
} from 'react-native';
import { X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../api/apiService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PopupModal = ({ popups = [], currentPage = 'dashboard', onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visible, setVisible] = useState(false);
    const [displayPopups, setDisplayPopups] = useState([]);

    useEffect(() => {
        loadAndFilterPopups();
    }, [popups, currentPage]);

    const loadAndFilterPopups = async () => {
        try {
            // Get closed popups from AsyncStorage
            const closedPopupsJson = await AsyncStorage.getItem('closedPopups');
            const closedPopups = closedPopupsJson ? JSON.parse(closedPopupsJson) : {};

            // Filter popups that should be shown
            const filtered = popups.filter(popup => {
                // Check if popup was closed
                const closedAt = closedPopups[popup.id];
                if (closedAt) {
                    // If popup was pushed again after being closed, show it
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
                // Track view for first popup
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
        try {
            await fetch(`${API_URL}/api/popups/${popupId}/view`, {
                method: 'POST',
            });
        } catch (error) {
            console.error('Error tracking view:', error);
        }
    };

    const trackClick = async (popupId) => {
        try {
            await fetch(`${API_URL}/api/popups/${popupId}/click`, {
                method: 'POST',
            });
        } catch (error) {
            console.error('Error tracking click:', error);
        }
    };

    const handleClose = async () => {
        if (displayPopups.length > 0) {
            const currentPopup = displayPopups[currentIndex];

            // Save closed popup to AsyncStorage
            try {
                const closedPopupsJson = await AsyncStorage.getItem('closedPopups');
                const closedPopups = closedPopupsJson ? JSON.parse(closedPopupsJson) : {};
                closedPopups[currentPopup.id] = new Date().toISOString();
                await AsyncStorage.setItem('closedPopups', JSON.stringify(closedPopups));
            } catch (error) {
                console.error('Error saving closed popup:', error);
            }

            // Close current modal first to create a "separated" feel
            setVisible(false);

            // Show next popup if available after a short delay
            if (currentIndex < displayPopups.length - 1) {
                setTimeout(() => {
                    const nextIndex = currentIndex + 1;
                    setCurrentIndex(nextIndex);
                    setVisible(true);
                    trackView(displayPopups[nextIndex].id);
                }, 400); // Wait for close animation to finish
            } else {
                if (onClose) onClose();
            }
        }
    };

    const handlePopupPress = async () => {
        const currentPopup = displayPopups[currentIndex];

        // Track click
        await trackClick(currentPopup.id);

        // Handle link
        if (currentPopup.link_type === 'url' && currentPopup.link_value) {
            try {
                await Linking.openURL(currentPopup.link_value);
            } catch (error) {
                console.error('Error opening URL:', error);
            }
        } else if (currentPopup.link_type === 'screen' && currentPopup.link_value) {
            // Navigation will be handled by parent component
            if (onClose) onClose(currentPopup.link_value);
        }

        // Close current popup and show next
        handleClose();
    };

    if (!visible || displayPopups.length === 0) {
        return null;
    }

    const currentPopup = displayPopups[currentIndex];

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Close Button */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClose}
                        activeOpacity={0.7}
                    >
                        <View style={styles.closeButtonInner}>
                            <X size={24} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    {/* Popup Image */}
                    <TouchableOpacity
                        activeOpacity={currentPopup.link_type !== 'none' ? 0.9 : 1}
                        onPress={currentPopup.link_type !== 'none' ? handlePopupPress : undefined}
                    >
                        <Image
                            source={{ uri: `${API_URL}${currentPopup.image_url}` }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>


                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: SCREEN_WIDTH * 0.9,
        maxWidth: 500,
        backgroundColor: 'transparent',
        borderRadius: 16,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: -20,
        right: -10,
        zIndex: 100,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    closeButtonInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    image: {
        width: '100%',
        aspectRatio: 1, // Will be overridden by contain if needed, or we can use auto height logic
        minHeight: 300,
        maxHeight: SCREEN_HEIGHT * 0.7,
        borderRadius: 16,
    },
});

export default PopupModal;
