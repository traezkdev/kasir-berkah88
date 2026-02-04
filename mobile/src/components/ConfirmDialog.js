import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    Animated,
    Dimensions,
    Platform
} from 'react-native';
import { AlertCircle, HelpCircle, TriangleAlert, Info } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const ConfirmDialog = ({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Ya',
    cancelText = 'Batal',
    type = 'primary' // 'primary', 'danger', 'info', 'warning'
}) => {
    // Animation
    const [scale] = React.useState(new Animated.Value(0.9));
    const [opacity] = React.useState(new Animated.Value(0));

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scale.setValue(0.9);
            opacity.setValue(0);
        }
    }, [visible]);

    const getIcon = () => {
        switch (type) {
            case 'danger': return <TriangleAlert color="#EF4444" size={32} />;
            case 'warning': return <AlertCircle color="#F59E0B" size={32} />;
            case 'info': return <Info color="#3B82F6" size={32} />;
            default: return <HelpCircle color="#138FEA" size={32} />;
        }
    };

    const getConfirmColor = () => {
        switch (type) {
            case 'danger': return '#EF4444';
            case 'warning': return '#F59E0B';
            case 'info': return '#3B82F6';
            default: return '#138FEA';
        }
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            opacity: opacity,
                            transform: [{ scale: scale }]
                        }
                    ]}
                >
                    <View style={styles.iconWrapper}>
                        {getIcon()}
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            onPress={onCancel}
                            style={styles.cancelBtn}
                        >
                            <Text style={styles.cancelBtnText}>{cancelText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onConfirm}
                            style={[styles.confirmBtn, { backgroundColor: getConfirmColor() }]}
                        >
                            <Text style={styles.confirmBtnText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
            },
            android: { elevation: 10 },
            web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.1)' }
        })
    },
    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#64748B',
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: { elevation: 4 },
        })
    },
    confirmBtnText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#FFFFFF',
    }
});

export default ConfirmDialog;
