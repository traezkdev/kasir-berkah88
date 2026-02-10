import { Platform } from 'react-native';

/**
 * Utility to calculate consistent bottom padding across devices
 * @param {object} insets - insets object from useSafeAreaInsets()
 * @param {number} offset - additional padding if inset is present (default: 5)
 * @param {number} fallback - padding if no inset is present (default: 24)
 * @returns {number} calculated padding
 */
export const getSafeBottomPadding = (insets, offset = 15, fallback = 24) => {
    // On Web, insets might not behave exactly like native
    if (Platform.OS === 'web') {
        return fallback;
    }

    // Logic: If there is a safe area (notch/gesture bar), use it + small offset
    // Otherwise use the fallback for breathing room
    return insets.bottom > 0 ? insets.bottom + offset : fallback;
};

/**
 * Utility to calculate consistent tab bar or footer height
 * @param {object} insets - insets object from useSafeAreaInsets()
 * @param {number} baseHeight - base height without safe area (default: 65)
 * @returns {number} calculated height
 */
export const getSafeFooterHeight = (insets, baseHeight = 65) => {
    return baseHeight + (insets.bottom > 0 ? insets.bottom : 0);
};
