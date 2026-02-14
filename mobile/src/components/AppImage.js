/* eslint-disable no-undef */
import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import {
    View,
    Animated,
    ActivityIndicator,
    StyleSheet,
    Image,
    Platform
} from 'react-native';
import { Image as ImageIcon } from 'lucide-react-native';
import { API_URL } from '../api/apiService';

/**
 * AppImage Component
 * Menampilkan gambar dengan efek loading fade-in dan penanganan path otomatis.
 * Dioptimalkan untuk mencegah loop re-render pada platform web (Expo Web).
 */
const AppImage = ({
    uri,
    style,
    resizeMode = 'cover',
    placeholderIcon = ImageIcon,
    showLoader = true,
    children
}) => {
    // Gunakan satu state status untuk sinkronisasi yang lebih stabil
    const [status, setStatus] = useState(uri ? 'loading' : 'error');
    const opacity = useRef(new Animated.Value(0)).current;

    // Memoize source object agar referensi tetap stabil selama URI tidak berubah
    const source = useMemo(() => {
        if (!uri) return null;
        if (typeof uri === 'string' && (uri.startsWith('http') || uri.startsWith('data:'))) {
            return { uri };
        }

        let path = typeof uri === 'string' ? uri : '';
        // Tambahkan path default jika hanya berisi nama file
        if (path && !path.includes('/') && !path.startsWith('public')) {
            path = `public/uploads/${path}`;
        }

        // Pastikan format URL benar (menghindari double slash atau missing slash)
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return { uri: `${API_URL}${cleanPath}` };
    }, [uri]);

    // Reset status hanya ketika URI benar-benar berubah
    useEffect(() => {
        setStatus(uri ? 'loading' : 'error');
        opacity.setValue(0);
    }, [uri]);

    // Gunakan useCallback untuk menjaga kestabilan referensi function
    const handleLoad = useCallback(() => {
        setStatus('success');
        Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: Platform.OS !== 'web' // Fix: native driver not supported on web
        }).start();
    }, [opacity]);

    const handleError = useCallback(() => {
        setStatus('error');
    }, []);

    // Bersihkan style agar resizeMode tidak menyebabkan peringatan di style prop
    const flattenedStyle = StyleSheet.flatten(style) || {};
    const { resizeMode: styleResizeMode, ...imageStyle } = flattenedStyle;
    const finalResizeMode = resizeMode || styleResizeMode || 'cover';

    return (
        <View style={[styles.container, style]}>
            {/* Hanya render gambar jika URI ada dan tidak sedang dalam status error */}
            {uri && status !== 'error' && (
                <Animated.Image
                    source={source}
                    style={[
                        styles.image,
                        { opacity: opacity },
                        imageStyle
                    ]}
                    resizeMode={finalResizeMode}
                    onLoad={handleLoad}
                    onError={handleError}
                />
            )}

            {/* Render placeholder jika error atau URI kosong */}
            {(status === 'error' || !uri) && (
                <View style={styles.placeholderContainer}>
                    {(() => {
                        const Placeholder = placeholderIcon;
                        const width = flattenedStyle.width;
                        const size = typeof width === 'number' ? width / 3 : 24;
                        return <Placeholder size={size} color="#CBD5E1" />;
                    })()}
                </View>
            )}

            {/* Overlay Loader */}
            {status === 'loading' && showLoader && uri && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="small" color="#059669" />
                </View>
            )}

            {/* Support for Overlay Content */}
            {children && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 2 }]}>
                    {children}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(248, 250, 252, 0.4)',
        zIndex: 5
    },
    placeholderContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
    }
});

export default memo(AppImage);
