import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Animated,
    TouchableOpacity,
    Dimensions,
    Platform
} from 'react-native';
import { CheckCircle2, AlertCircle, XCircle, Info, X } from 'lucide-react-native';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState({
        visible: false,
        message: '',
        type: 'success', // success, error, info, warning
    });

    const translateY = new Animated.Value(-100);
    const opacity = new Animated.Value(0);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ visible: true, message, type });
    }, []);

    const hideToast = useCallback(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setToast(prev => ({ ...prev, visible: false }));
        });
    }, [translateY, opacity]);

    useEffect(() => {
        if (toast.visible) {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: Platform.OS === 'ios' ? 60 : 40,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();

            const timer = setTimeout(() => {
                hideToast();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [toast.visible, hideToast, translateY, opacity]);

    const getIcon = () => {
        switch (toast.type) {
            case 'success': return <CheckCircle2 size={24} color="#10B981" />;
            case 'error': return <XCircle size={24} color="#EF4444" />;
            case 'warning': return <AlertCircle size={24} color="#F59E0B" />;
            default: return <Info size={24} color="#3B82F6" />;
        }
    };

    const getBorderColor = () => {
        switch (toast.type) {
            case 'success': return '#10B981';
            case 'error': return '#EF4444';
            case 'warning': return '#F59E0B';
            default: return '#3B82F6';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast.visible && (
                <Animated.View style={[
                    styles.toastContainer,
                    { transform: [{ translateY }], opacity, borderLeftColor: getBorderColor() }
                ]}>
                    <View style={styles.toastContent}>
                        <View style={styles.iconArea}>
                            {getIcon()}
                        </View>
                        <View style={styles.textArea}>
                            <Text style={styles.toastTitle}>
                                {toast.type.toUpperCase()}
                            </Text>
                            <Text style={styles.toastMessage}>{toast.message}</Text>
                        </View>
                        <TouchableOpacity onPress={hideToast} style={styles.closeBtn}>
                            <X size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 999999, // Sangat tinggi agar muncul di atas modal dan elemen lainnya
        borderLeftWidth: 6,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
            },
            android: {
                elevation: 10,
            },
            web: {
                boxShadow: '0px 10px 30px rgba(0,0,0,0.1)',
            }
        }),
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconArea: {
        marginRight: 12,
    },
    textArea: {
        flex: 1,
    },
    toastTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 2,
    },
    toastMessage: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    closeBtn: {
        padding: 4,
    }
});
