import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Modal,
    TouchableOpacity,
    ScrollView,
    Pressable,
    Platform
} from 'react-native';
import { X, Check } from 'lucide-react-native';

const OptionSelectionModal = ({ visible, onClose, item, onAddToCartWithOptions }) => {
    const [selectedOption, setSelectedOption] = useState(null);

    useEffect(() => {
        if (item && item.options && item.options.length > 0) {
            setSelectedOption(item.options[0]);
        } else {
            setSelectedOption(null);
        }
    }, [item, visible]);

    if (!item) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleConfirm = () => {
        if (selectedOption) {
            onAddToCartWithOptions(item, [selectedOption]);
        }
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Pilih Variasi</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                    </View>

                    <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                        {(item.options || []).map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.optionItem,
                                    selectedOption?.id === option.id && styles.selectedOptionItem
                                ]}
                                onPress={() => setSelectedOption(option)}
                            >
                                <View style={styles.optionMain}>
                                    <View style={[
                                        styles.radioButton,
                                        selectedOption?.id === option.id && styles.radioButtonSelected
                                    ]}>
                                        {selectedOption?.id === option.id && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={[
                                        styles.optionName,
                                        selectedOption?.id === option.id && styles.selectedOptionText
                                    ]}>
                                        {option.name}
                                    </Text>
                                </View>
                                <Text style={[
                                    styles.priceAdj,
                                    selectedOption?.id === option.id && styles.selectedOptionText
                                ]}>
                                    {option.price_adjustment > 0 ? `+${formatCurrency(option.price_adjustment)}` : 'Gratis'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelText}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                            <Check size={20} color="#FFFFFF" strokeWidth={3} />
                            <Text style={styles.confirmText}>Tambahkan</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    closeBtn: {
        padding: 4,
    },
    itemInfo: {
        padding: 20,
        backgroundColor: '#F8FAFC',
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#475569',
    },
    itemPrice: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    optionsList: {
        maxHeight: 300,
        padding: 20,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 10,
    },
    selectedOptionItem: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF',
    },
    optionMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        borderColor: '#2563EB',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#2563EB',
    },
    optionName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    selectedOptionText: {
        color: '#1E40AF',
    },
    priceAdj: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#64748B',
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    cancelBtn: {
        flex: 1,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 15,
        backgroundColor: '#F1F5F9',
    },
    cancelText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
    },
    confirmBtn: {
        flex: 2,
        height: 50,
        backgroundColor: '#2563EB',
        borderRadius: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    confirmText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#FFFFFF',
    },
});

export default OptionSelectionModal;
