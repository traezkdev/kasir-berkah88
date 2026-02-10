import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Modal,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Bluetooth, X, RefreshCw, Printer } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BluetoothPrinter from '../utils/BluetoothPrinter';

const PrinterSelectionModal = ({ visible, onClose, onSelect }) => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [connectingId, setConnectingId] = useState(null);

    useEffect(() => {
        if (visible) {
            scanDevices();
        }
    }, [visible]);

    const scanDevices = async () => {
        setLoading(true);
        try {
            const pairedDevices = await BluetoothPrinter.scanDevices();
            setDevices(pairedDevices);
        } catch (error) {
            console.error('Scan Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (device) => {
        setConnectingId(device.address);
        try {
            await BluetoothPrinter.connect(device.address);
            onSelect(device);
            onClose();
        } catch (error) {
            alert('Gagal menyambung ke ' + device.name);
        } finally {
            setConnectingId(null);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <View style={styles.headerTitleRow}>
                            <Bluetooth size={20} color="#1E40AF" />
                            <Text style={styles.headerTitle}>Pilih Printer Bluetooth</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {loading ? (
                            <View style={styles.centerContainer}>
                                <ActivityIndicator size="large" color="#148FEA" />
                                <Text style={styles.loadingText}>Mencari perangkat...</Text>
                            </View>
                        ) : devices.length === 0 ? (
                            <View style={styles.centerContainer}>
                                <Printer size={48} color="#CBD5E1" strokeWidth={1} />
                                <Text style={styles.emptyText}>Tidak ada printer ditemukan</Text>
                                <Text style={styles.emptySubText}>Pastikan printer sudah dipairing di pengaturan Bluetooth HP Anda.</Text>
                                <TouchableOpacity style={styles.refreshBtn} onPress={scanDevices}>
                                    <RefreshCw size={16} color="#FFFFFF" />
                                    <Text style={styles.refreshBtnText}>Scan Ulang</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <FlatList
                                data={devices}
                                keyExtractor={(item) => item.address}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.deviceItem}
                                        onPress={() => handleConnect(item)}
                                        disabled={connectingId !== null}
                                    >
                                        <View style={styles.deviceIconBg}>
                                            <Printer size={20} color="#1E40AF" />
                                        </View>
                                        <View style={styles.deviceInfo}>
                                            <Text style={styles.deviceName}>{item.name}</Text>
                                            <Text style={styles.deviceAddress}>{item.address}</Text>
                                        </View>
                                        {connectingId === item.address ? (
                                            <ActivityIndicator size="small" color="#148FEA" />
                                        ) : (
                                            <View style={styles.connectBadge}>
                                                <Text style={styles.connectText}>Hubungkan</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerNote}>* Hanya menampilkan perangkat yang sudah berpasangan (paired).</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        padding: 10,
        minHeight: 300,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        color: '#64748B',
        fontSize: 14,
    },
    deviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8FAFC',
        marginBottom: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    deviceIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    deviceAddress: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    connectBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#1E40AF',
        borderRadius: 8,
    },
    connectText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
    refreshBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#148FEA',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 14,
        marginTop: 24,
        gap: 8,
    },
    refreshBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    footer: {
        padding: 15,
        backgroundColor: '#F8FAFC',
    },
    footerNote: {
        fontSize: 11,
        color: '#94A3B8',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default PrinterSelectionModal;
