import React, { useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    useWindowDimensions,
    Platform,
    StatusBar,
    Animated,
    PanResponder
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSafeBottomPadding } from '../../utils/safeArea';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { X } from 'lucide-react-native';

/**
 * BottomModalTemplate
 */
const BottomModalTemplate = ({
    visible,
    onClose,
    title = 'Detail',
    children,
    footer,
    heightPercentage = 0.85,
    height = null, // Can be "85%" style string
    disableSwipe = false
}) => {
    const { height: screenHeight } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    // Calculate modal height explicitly
    const resolvedHeightPercentage = useMemo(() => {
        if (height && typeof height === 'string' && height.endsWith('%')) {
            return parseInt(height) / 100;
        }
        return heightPercentage;
    }, [height, heightPercentage]);

    const modalHeight = useMemo(() => screenHeight * resolvedHeightPercentage, [screenHeight, resolvedHeightPercentage]);

    const isFullscreen = resolvedHeightPercentage >= 1;
    const safeTopPadding = isFullscreen
        ? Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 10
        : 10;

    // Animation & Gesture State
    const pan = React.useRef(new Animated.ValueXY()).current;

    // Reset position when modal becomes visible
    React.useEffect(() => {
        if (visible) {
            pan.setValue({ x: 0, y: 0 });
        }
    }, [visible, pan]);

    // PanResponder for drag-to-close behavior
    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dy > 5;
            },
            onPanResponderGrant: () => {
                pan.setOffset({ x: pan.x._value, y: pan.y._value });
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    Animated.event([null, { dy: pan.y }], { useNativeDriver: false })(_, gestureState);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                pan.flattenOffset();
                if (gestureState.dy > 150 || (gestureState.dy > 50 && gestureState.vy > 1)) {
                    onClose();
                } else {
                    Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
                }
            }
        })
    ).current;

    const backdropOpacity = pan.y.interpolate({
        inputRange: [0, modalHeight],
        outputRange: [0.5, 0],
        extrapolate: 'clamp'
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Animated Backdrop */}
                <Animated.View
                    style={[
                        styles.backdropVisual,
                        { opacity: backdropOpacity }
                    ]}
                />

                {/* Touchable Backdrop for tap-to-close */}
                <TouchableOpacity
                    style={styles.backdropTouchable}
                    onPress={onClose}
                    activeOpacity={1}
                />

                <Animated.View
                    style={[
                        styles.modalContainer,
                        { height: modalHeight },
                        { transform: [{ translateY: pan.y }] },
                        isFullscreen && { borderTopLeftRadius: 0, borderTopRightRadius: 0 }
                    ]}
                >
                    {/* Header - Fixed & Swipeable */}
                    <View
                        style={[
                            styles.header,
                            { paddingTop: safeTopPadding },
                            isFullscreen && { borderTopLeftRadius: 0, borderTopRightRadius: 0 }
                        ]}
                        {...(!disableSwipe ? panResponder.panHandlers : {})}
                    >
                        {!disableSwipe && (
                            <View style={styles.grabberContainer}>
                                <View style={styles.grabber} />
                            </View>
                        )}
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>{title}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={20} color="#1E293B" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Scrollable Content dengan Keyboard Awareness */}
                    <KeyboardAwareScrollView
                        style={{ flex: 1, width: '100%' }}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        bounces={true}
                        enableOnAndroid={true}
                        extraScrollHeight={20}
                        keyboardShouldPersistTaps="handled"
                    >
                        {children}
                    </KeyboardAwareScrollView>

                    {/* Footer - Fixed di bawah (jika ada) */}
                    {footer && (
                        <View style={[
                            styles.footer,
                            {
                                paddingBottom: getSafeBottomPadding(insets),
                                backgroundColor: '#FFFFFF'
                            }
                        ]}>
                            {footer}
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal >
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdropVisual: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'black',
    },
    backdropTouchable: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        zIndex: 10,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        // paddingTop is handled inline based on isFullscreen
    },
    grabberContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 8,
    },
    grabber: {
        width: 40,
        height: 5,
        backgroundColor: '#E2E8F0',
        borderRadius: 10,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 15,
        paddingTop: 0, // Reduced from 10 to make it tighter with grabber
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    closeBtn: {
        padding: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
    },
    scrollContent: {
        padding: 24,
        flexGrow: 1,
    },
    footer: {
        width: '100%',
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
        zIndex: 999,
        elevation: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -5 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
            },
            web: {
                boxShadow: '0px -5px 15px rgba(0,0,0,0.05)',
            }
        })
    }
});

export default BottomModalTemplate;
