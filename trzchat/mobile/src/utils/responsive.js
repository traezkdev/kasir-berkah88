import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Ukuran standar desain (iPhone 11 / 12 Pro sebagai basis: 390x844)
// Anda bisa sesuaikan basis ini. Umumnya 375x812.
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Menskalakan ukuran berdasarkan lebar layar (width).
 * Cocok untuk: padding horizontal, margin horizontal, lebar elemen.
 */
const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Menskalakan ukuran berdasarkan tinggi layar (height).
 * Cocok untuk: padding vertical, margin vertical, tinggi elemen.
 */
const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Menskalakan ukuran dengan faktor moderasi.
 * Paling bagus untuk: fontSize, karena tidak terlalu drastis perubahannya.
 */
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * Persentase lebar layar.
 * Contoh: wp(50) = 50% dari lebar layar.
 */
const wp = (percentage) => {
    const value = (percentage * SCREEN_WIDTH) / 100;
    return Math.round(value);
};

/**
 * Persentase tinggi layar.
 * Contoh: hp(50) = 50% dari tinggi layar.
 */
const hp = (percentage) => {
    const value = (percentage * SCREEN_HEIGHT) / 100;
    return Math.round(value);
};

export {
    scale,
    verticalScale,
    moderateScale,
    wp,
    hp,
    SCREEN_WIDTH,
    SCREEN_HEIGHT
};
