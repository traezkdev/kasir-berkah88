import { useRef, useEffect } from 'react';
import { Animated, PanResponder, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Custom hook to handle swipe-down-to-close gesture for modals
 * @param {Function} onClose - Callback function to close the modal
 * @param {number} closeThreshold - Distance in pixels to trigger close (default: 100)
 * @returns {Object} { panY, panResponder, resetPan }
 */
const useSwipeToClose = (onClose, closeThreshold = 100) => {
    const panY = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only capture if swiping downwards
                return gestureState.dy > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > closeThreshold) {
                    Animated.timing(panY, {
                        toValue: SCREEN_HEIGHT,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        onClose();
                        panY.setValue(0);
                    });
                } else {
                    Animated.spring(panY, {
                        toValue: 0,
                        friction: 8,
                        tension: 40,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const resetPan = () => {
        panY.setValue(0);
    };

    return { panY, panResponder, resetPan };
};

export default useSwipeToClose;
