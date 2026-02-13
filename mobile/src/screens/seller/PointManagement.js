import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Switch,
    Platform,
    StatusBar,
    Animated,
    Modal,
    FlatList
} from 'react-native';
import {
    Gift,
    ArrowLeft,
    Check,
    PlusCircle,
    Info,
    Zap,
    History,
    Settings,
    User,
    Search,
    X,
    ChevronDown
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import { useToast } from '../../context/ToastContext';

const PointManagement = ({ navigation }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [settings, setSettings] = useState({
        point_system_enabled: '1',
        points_per_item: '100'
    });

    // Manual Points State
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [manualPoints, setManualPoints] = useState('');
    const [manualDesc, setManualDesc] = useState('');
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [actionType, setActionType] = useState('add'); // 'add' or 'reduce'

    useEffect(() => {
        fetchSettings();
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (searchText) {
            const lower = searchText.toLowerCase();
            setFilteredCustomers(
                customers.filter(c =>
                    c.username.toLowerCase().includes(lower) ||
                    (c.phone && c.phone.includes(lower))
                )
            );
        } else {
            setFilteredCustomers(customers);
        }
    }, [searchText, customers]);

    const fetchSettings = async () => {
        try {
            const response = await apiService.get('/api/point-settings');
            if (response.data.data) {
                setSettings(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching point settings:', error);
            showToast('Gagal mengambil pengaturan poin', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await apiService.get('/api/customers/simple');
            if (response.data.data) {
                setCustomers(response.data.data);
                setFilteredCustomers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiService.put('/api/point-settings', {
                point_system_enabled: settings.point_system_enabled === '1',
                points_per_item: parseInt(settings.points_per_item)
            });
            showToast('Pengaturan poin berhasil disimpan', 'success');
        } catch (error) {
            console.error('Error saving point settings:', error);
            showToast('Gagal menyimpan pengaturan poin', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleAddManualPoints = async () => {
        if (!selectedCustomer) {
            showToast('Pilih pelanggan terlebih dahulu', 'error');
            return;
        }
        if (!manualPoints) {
            showToast('Masukkan jumlah poin', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const amount = parseInt(manualPoints);
            const finalAmount = actionType === 'add' ? amount : -Math.abs(amount);

            await apiService.post('/api/customers/points/manual', {
                customer_id: selectedCustomer.id,
                amount: finalAmount,
                description: manualDesc || (actionType === 'add' ? 'Penambahan poin manual' : 'Pengurangan poin manual')
            });
            showToast(actionType === 'add' ? 'Poin berhasil ditambahkan' : 'Poin berhasil dikurangi', 'success');

            // Reset form
            setManualPoints('');
            setManualDesc('');
            setSelectedCustomer(null);

            // Refresh customer list to update points display
            fetchCustomers();
        } catch (error) {
            console.error('Error adding manual points:', error);
            showToast('Gagal menambahkan poin', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleSwitch = (value) => {
        setSettings(prev => ({ ...prev, point_system_enabled: value ? '1' : '0' }));
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#138FEA" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                    >
                        <ArrowLeft color="#FFFFFF" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Manajemen Poin</Text>
                    <View style={{ width: 45 }} />
                </View>
                <Text style={styles.headerDesc}>
                    Kembangkan loyalitas pelanggan dengan sistem reward poin.
                </Text>

                {/* Status Float Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusInfo}>
                        <View style={[styles.statusIcon, { backgroundColor: settings.point_system_enabled === '1' ? '#F0FDF4' : '#F8FAFC' }]}>
                            <Gift size={24} color={settings.point_system_enabled === '1' ? '#22C55E' : '#94A3B8'} />
                        </View>
                        <View>
                            <Text style={styles.statusLabel}>STATUS SISTEM</Text>
                            <Text style={[styles.statusValue, { color: settings.point_system_enabled === '1' ? '#1E293B' : '#94A3B8' }]}>
                                {settings.point_system_enabled === '1' ? 'Aktif & Berjalan' : 'Nonaktif'}
                            </Text>
                        </View>
                    </View>
                    <Switch
                        trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                        thumbColor={settings.point_system_enabled === '1' ? '#138FEA' : '#94A3B8'}
                        ios_backgroundColor="#E2E8F0"
                        onValueChange={toggleSwitch}
                        value={settings.point_system_enabled === '1'}
                    />
                </View>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Configuration Section */}
                <View style={[styles.card, { marginTop: 45 }]}>
                    <View style={styles.cardHeader}>
                        <Settings size={20} color="#1E293B" />
                        <Text style={styles.cardTitle}>Pengaturan Dasar</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>POIN PER ITEM</Text>
                        <View style={styles.inputWrapper}>
                            <View style={styles.inputPrefix}>
                                <PlusCircle size={20} color="#138FEA" />
                            </View>
                            <TextInput
                                style={styles.input}
                                value={settings.points_per_item}
                                onChangeText={(text) => setSettings(prev => ({ ...prev, points_per_item: text }))}
                                keyboardType="numeric"
                                placeholder="100"
                                placeholderTextColor="#94A3B8"
                            />
                            <View style={styles.inputSuffix}>
                                <Text style={styles.suffixText}>TIAP ITEM</Text>
                            </View>
                        </View>
                        <Text style={styles.inputHint}>
                            Pelanggan akan mendapatkan nilai poin ini untuk setiap satu item yang mereka beli.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Check color="#FFFFFF" size={20} strokeWidth={3} />
                                <Text style={styles.saveBtnText}>Simpan Pengaturan</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Manual Points Section */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Zap size={20} color="#F59E0B" />
                        <Text style={styles.cardTitle}>Tambah Poin Manual</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>PILIH PELANGGAN</Text>
                        <TouchableOpacity
                            style={styles.dropdownBtn}
                            onPress={() => setShowCustomerModal(true)}
                        >
                            {selectedCustomer ? (
                                <View style={styles.selectedCustomer}>
                                    <View style={styles.customerAvatarSmall}>
                                        <Text style={styles.customerInitialsSmall}>
                                            {selectedCustomer.username.substring(0, 2).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.selectedCustomerName}>{selectedCustomer.username}</Text>
                                        <Text style={styles.selectedCustomerPoints}>{selectedCustomer.points} Poin saat ini</Text>
                                    </View>
                                </View>
                            ) : (
                                <Text style={styles.dropdownPlaceholder}>Cari pelanggan...</Text>
                            )}
                            <ChevronDown size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>TINDAKAN</Text>
                        <View style={styles.actionToggleContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.actionBtn,
                                    actionType === 'add' ? styles.actionBtnAddActive : styles.actionBtnInactive
                                ]}
                                onPress={() => setActionType('add')}
                            >
                                <PlusCircle size={18} color={actionType === 'add' ? '#FFFFFF' : '#94A3B8'} />
                                <Text style={[styles.actionBtnText, actionType === 'add' && styles.actionBtnTextActive]}>Tambah</Text>
                            </TouchableOpacity>
                            <View style={{ width: 10 }} />
                            <TouchableOpacity
                                style={[
                                    styles.actionBtn,
                                    actionType === 'reduce' ? styles.actionBtnReduceActive : styles.actionBtnInactive
                                ]}
                                onPress={() => setActionType('reduce')}
                            >
                                <X size={18} color={actionType === 'reduce' ? '#FFFFFF' : '#94A3B8'} />
                                <Text style={[styles.actionBtnText, actionType === 'reduce' && styles.actionBtnTextActive]}>Kurangi</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.rowInputs}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.inputLabel}>JUMLAH POIN</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={manualPoints}
                                    onChangeText={setManualPoints}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </View>

                        <View style={[styles.inputGroup, { flex: 1.5 }]}>
                            <Text style={styles.inputLabel}>KETERANGAN</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={manualDesc}
                                    onChangeText={setManualDesc}
                                    placeholder="Bonus, Refund, dll"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            actionType === 'add' ? styles.addBtn : styles.reduceBtn,
                            submitting && styles.saveBtnDisabled
                        ]}
                        onPress={handleAddManualPoints}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                {actionType === 'add' ? (
                                    <PlusCircle color="#FFFFFF" size={20} />
                                ) : (
                                    <X color="#FFFFFF" size={20} />
                                )}
                                <Text style={styles.saveBtnText}>
                                    {actionType === 'add' ? 'Tambahkan Poin' : 'Kurangi Poin'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoContent}>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoSub}>INFORMASI</Text>
                            <Text style={styles.infoTitle}>Cara Kerja Poin</Text>
                            <Text style={styles.infoDesc}>
                                Poin otomatis ditambahkan ke akun pelanggan saat pesanan ditandai sebagai "Selesai". Poin tidak akan diberikan jika sistem dalam status Nonaktif.
                            </Text>
                        </View>
                        <View style={styles.infoIconBox}>
                            <Info size={32} color="#FFFFFF" />
                        </View>
                    </View>
                </View>

                {/* Tip Card */}
                <View style={styles.tipCard}>
                    <View style={styles.tipHeader}>
                        <View style={styles.tipIconBox}>
                            <Zap size={18} color="#F59E0B" fill="#F59E0B" />
                        </View>
                        <Text style={styles.tipTitle}>Tips Penjualan</Text>
                    </View>
                    <Text style={styles.tipDesc}>
                        Memberikan 100 poin per item setara dengan memberikan reward kecil yang memotivasi pelanggan untuk terus berbelanja di tokomu.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Customer Selection Modal */}
            <Modal
                visible={showCustomerModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCustomerModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pilih Pelanggan</Text>
                            <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                                <X size={24} color="#1E293B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchBar}>
                            <Search size={20} color="#94A3B8" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Cari nama atau nomor HP..."
                                value={searchText}
                                onChangeText={setSearchText}
                                placeholderTextColor="#94A3B8"
                            />
                            {searchText.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchText('')}>
                                    <X size={16} color="#94A3B8" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <FlatList
                            data={filteredCustomers}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.customerItem}
                                    onPress={() => {
                                        setSelectedCustomer(item);
                                        setShowCustomerModal(false);
                                    }}
                                >
                                    <View style={styles.customerAvatar}>
                                        <Text style={styles.customerInitials}>
                                            {item.username.substring(0, 2).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.customerInfo}>
                                        <Text style={styles.customerName}>{item.username}</Text>
                                        <Text style={styles.customerPhone}>{item.phone || 'Tanpa No HP'}</Text>
                                    </View>
                                    <View style={styles.customerPointsBadge}>
                                        <Text style={styles.customerPoints}>{item.points} Poin</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyList}>
                                    <Text style={styles.emptyListText}>Pelanggan tidak ditemukan</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#1E40AF',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 40,
        paddingBottom: 80,
        paddingHorizontal: 25,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    backBtn: {
        width: 45,
        height: 45,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    headerDesc: {
        fontSize: 14,
        color: '#BFDBFE',
        fontWeight: '500',
        lineHeight: 20,
        maxWidth: '80%',
    },
    statusCard: {
        position: 'absolute',
        bottom: -40,
        left: 20,
        right: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 10px 30px rgba(0,0,0,0.1)' },
            android: { elevation: 12 },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.1,
                shadowRadius: 15,
            }
        })
    },
    statusInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIcon: {
        width: 50,
        height: 50,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    statusLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    statusValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 240,
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 25,
        marginTop: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    inputGroup: {
        marginBottom: 25,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 2,
        marginBottom: 12,
        paddingLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    inputPrefix: {
        paddingLeft: 18,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 12,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    inputSuffix: {
        paddingRight: 18,
    },
    suffixText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 0.5,
    },
    inputHint: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
        marginTop: 10,
        paddingHorizontal: 5,
        lineHeight: 16,
    },
    saveBtn: {
        backgroundColor: '#138FEA',
        flexDirection: 'row',
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        shadowColor: '#138FEA',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 6,
    },
    saveBtnDisabled: {
        backgroundColor: '#BFDBFE',
        elevation: 0,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },
    addBtn: {
        backgroundColor: '#22C55E', // Green for adding
        flexDirection: 'row',
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 6,
    },
    reduceBtn: {
        backgroundColor: '#EF4444', // Red for reducing
        flexDirection: 'row',
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 6,
    },
    actionToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        flex: 1,
        height: 50,
        borderRadius: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
    },
    actionBtnInactive: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
    },
    actionBtnAddActive: {
        backgroundColor: '#22C55E',
        borderColor: '#22C55E',
    },
    actionBtnReduceActive: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#94A3B8',
    },
    actionBtnTextActive: {
        color: '#FFFFFF',
    },
    dropdownBtn: {
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    dropdownPlaceholder: {
        color: '#94A3B8',
        fontWeight: '500',
    },
    selectedCustomer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    customerAvatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    customerInitialsSmall: {
        fontSize: 12,
        fontWeight: '900',
        color: '#1E40AF',
    },
    selectedCustomerName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    selectedCustomerPoints: {
        fontSize: 11,
        color: '#22C55E',
        fontWeight: 'bold',
    },
    rowInputs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    // Info Card Styles
    infoCard: {
        backgroundColor: '#4F46E5',
        borderRadius: 30,
        padding: 25,
        marginBottom: 20,
        overflow: 'hidden',
    },
    infoContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    infoTextContainer: {
        flex: 1,
        marginRight: 15,
    },
    infoSub: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    infoTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    infoDesc: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
    },
    infoIconBox: {
        width: 60,
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '15deg' }],
    },
    tipCard: {
        backgroundColor: '#FFFBEB',
        borderRadius: 25,
        padding: 20,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    tipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    tipIconBox: {
        width: 32,
        height: 32,
        backgroundColor: '#FEF3C7',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    tipTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#92400E',
    },
    tipDesc: {
        fontSize: 13,
        color: '#B45309',
        lineHeight: 18,
        fontWeight: '500',
    },

    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#1E293B',
    },
    customerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    customerAvatar: {
        width: 45,
        height: 45,
        borderRadius: 15,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    customerInitials: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E40AF',
    },
    customerInfo: {
        flex: 1,
    },
    customerName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 2,
    },
    customerPhone: {
        fontSize: 12,
        color: '#64748B',
    },
    customerPointsBadge: {
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    customerPoints: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#16A34A',
    },
    emptyList: {
        padding: 20,
        alignItems: 'center',
    },
    emptyListText: {
        color: '#94A3B8',
        fontStyle: 'italic',
    }
});

export default PointManagement;
