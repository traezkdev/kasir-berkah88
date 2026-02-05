import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Dimensions,
    Platform,
    StatusBar,
    SafeAreaView,
    TextInput,
    Alert,
    Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ArrowLeft,
    Trash2,
    Plus,
    Minus,
    ShoppingBag,
    ChevronRight,
    MapPin,
    CreditCard,
    Ticket,
    Info,
    CheckCircle2,
    Banknote,
    QrCode,
    X,
    Download
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as MediaLibrary from 'expo-media-library';
import { Asset } from 'expo-asset';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import apiService, { API_URL } from '../../api/apiService';

const { width } = Dimensions.get('window');

// Memoized Cart Item to prevent full list re-renders (Anti-Delay)
const CartItem = React.memo(({ item, updateQuantity, handleRemoveItem, formatCurrency }) => {
    return (
        <View style={styles.cartItem}>
            <Image
                source={{ uri: item.image_url ? `${API_URL}${item.image_url}` : 'https://via.placeholder.com/150' }}
                style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
                <View style={styles.itemNameRow}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <TouchableOpacity onPress={() => handleRemoveItem(item.cartId, item.name)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Trash2 size={14} color="#EF4444" />
                    </TouchableOpacity>
                </View>

                {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <Text style={styles.itemOptions}>
                        {item.selectedOptions.map(o => o.name).join(', ')}
                    </Text>
                )}

                <View style={styles.itemFooter}>
                    <Text style={styles.itemPrice}>
                        {formatCurrency((item.price * (1 - (item.discount || 0) / 100)) + (item.selectedOptions?.reduce((acc, o) => acc + (parseFloat(o.price_adjustment) || 0), 0) || 0))}
                    </Text>
                    <View style={styles.qtyBox}>
                        <TouchableOpacity
                            style={styles.qtyBtn}
                            activeOpacity={0.6}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            onPress={() => updateQuantity(item.cartId, -1)}
                        >
                            <Minus size={14} color="#64748B" />
                        </TouchableOpacity>
                        <Text style={styles.qtyVal}>{item.quantity}</Text>
                        <TouchableOpacity
                            style={[styles.qtyBtn, { backgroundColor: '#059669' }]}
                            activeOpacity={0.6}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            onPress={() => updateQuantity(item.cartId, 1)}
                        >
                            <Plus size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
});

const CustomerCart = ({ navigation }) => {
    const {
        cart,
        updateQuantity,
        removeFromCart,
        cartTotal,
        clearCart
    } = useCart();
    const { user } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [savedAddress, setSavedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [showQrisModal, setShowQrisModal] = useState(false);

    // Fetch user profile to get saved address
    useFocusEffect(
        useCallback(() => {
            const fetchUserProfile = async () => {
                try {
                    const response = await apiService.get('/api/user/profile');
                    if (response.data.message === 'success' && response.data.data.address) {
                        setSavedAddress(response.data.data.address);
                    } else {
                        setSavedAddress(null);
                    }
                } catch (error) {
                    console.error("Error fetching profile address:", error);
                }
            };

            if (user) {
                fetchUserProfile();
            }
        }, [user])
    );

    // Muat data terakhir dari storage saat buka keranjang
    useEffect(() => {
        const loadLastData = async () => {
            try {
                const [lastAddr, lastPhone] = await Promise.all([
                    AsyncStorage.getItem('last_delivery_address'),
                    AsyncStorage.getItem('last_customer_phone')
                ]);
                if (lastAddr) setCustomerAddress(lastAddr);
                if (lastPhone) setCustomerPhone(lastPhone);
            } catch (e) {
                console.error("Gagal muat data terakhir:", e);
            }
        };
        loadLastData();
    }, []);

    // Simpan data setiap kali berubah
    useEffect(() => {
        const saveData = async () => {
            try {
                if (customerAddress) await AsyncStorage.setItem('last_delivery_address', customerAddress);
                if (customerPhone) await AsyncStorage.setItem('last_customer_phone', customerPhone);
            } catch (e) {
                console.error("Gagal simpan data:", e);
            }
        };
        saveData();
    }, [customerAddress, customerPhone]);

    const handleDownloadQris = async () => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync(true);
            if (status !== 'granted') {
                Alert.alert('Izin Ditolak', 'Maaf, kami membutuhkan izin akses galeri untuk menyimpan gambar.');
                return;
            }

            const asset = Asset.fromModule(require('../../../assets/qris.jpeg'));
            await asset.downloadAsync();
            await MediaLibrary.saveToLibraryAsync(asset.localUri || asset.uri);

            Alert.alert('Berhasil', 'Gambar QRIS berhasil disimpan ke galeri!');
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan gambar.');
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val || 0);
    };

    const handleRemoveItem = async (cartId, itemName) => {
        const accepted = await confirm({
            title: 'Hapus Item',
            message: `Hapus ${itemName} dari keranjang?`,
            confirmText: 'Ya, Hapus',
            type: 'danger'
        });
        if (accepted) {
            removeFromCart(cartId);
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        if (!customerAddress || !customerAddress.trim()) {
            showToast('Alamat pengiriman wajib diisi!', 'error');
            return;
        }

        const accepted = await confirm({
            title: 'Konfirmasi Pesanan',
            message: `Total belanja Anda adalah ${formatCurrency(cartTotal)}. Lanjutkan pemesanan?`,
            confirmText: 'Pesan Sekarang',
            type: 'primary'
        });

        if (!accepted) return;

        setLoading(true);
        try {
            // Prepare order data to match backend expectations
            const orderItems = cart.map(item => ({
                id: item.id, // Backend uses 'id' instead of 'menu_item_id'
                quantity: item.quantity,
                options: (item.selectedOptions || []).map(opt => ({ id: opt.id })) // Backend expects array of objects with id
            }));

            const payload = {
                items: orderItems,
                payment_method: paymentMethod === 'cash' ? 'Tunai' : (paymentMethod === 'transfer' ? 'Transfer' : paymentMethod),
                notes: notes,
                customer_address: customerAddress || null,
                customer_phone: customerPhone || null,
                customer_name: user?.username || user?.name || 'Pelanggan'
            };

            const response = await apiService.post('/api/orders', payload);

            // Backend returns 201 Created and detailed message
            if (response.status === 201 || (response.data && response.data.data)) {
                showToast('Pesanan berhasil dibuat! Silakan tunggu konfirmasi.', 'success');
                clearCart();
                // Navigate to OrderDetails with the new ID
                navigation.navigate('OrderDetails', { orderId: response.data.data.id });
            } else {
                throw new Error(response.data.error || 'Gagal membuat pesanan');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            showToast(error.message || 'Gagal memproses pesanan. Silakan coba lagi.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconWrap}>
                        <ShoppingBag size={60} color="#E2E8F0" />
                    </View>
                    <Text style={styles.emptyTitle}>Keranjang Kosong</Text>
                    <Text style={styles.emptySubtitle}>Sepertinya Anda belum memilih menu apapun.</Text>
                    <TouchableOpacity
                        style={styles.browseBtn}
                        onPress={() => navigation.navigate('Menu')}
                    >
                        <Text style={styles.browseBtnText}>Cari Menu Sekarang</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={20} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Keranjang Saya</Text>
                <TouchableOpacity onPress={() => clearCart()} style={styles.clearBtn}>
                    <Trash2 size={18} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Item Pesanan</Text>
                    {cart.map((item) => (
                        <CartItem
                            key={item.cartId}
                            item={item}
                            updateQuantity={updateQuantity}
                            handleRemoveItem={handleRemoveItem}
                            formatCurrency={formatCurrency}
                        />
                    ))}
                </View>

                {/* Delivery Notes */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Catatan Pesanan (Optional)</Text>
                    <View style={styles.notesInputRow}>
                        <Info size={16} color="#94A3B8" />
                        <TextInput
                            placeholder="Contoh: Jangan terlalu pedas ya..."
                            style={styles.notesInput}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                        />
                    </View>
                </View>

                {/* Delivery Address */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Data Pengiriman <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>

                    {/* Phone Input */}
                    <View style={[styles.notesInputRow, { marginBottom: 12 }]}>
                        <CreditCard size={16} color="#94A3B8" />
                        <TextInput
                            placeholder="Nomor Telepon / WhatsApp"
                            style={[styles.notesInput, { height: 40 }]}
                            value={customerPhone}
                            onChangeText={setCustomerPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    {savedAddress && (
                        <TouchableOpacity
                            style={[styles.savedAddressCard, { marginBottom: 12 }]}
                            onPress={() => setCustomerAddress(savedAddress)}
                        >
                            <View style={styles.savedAddressIcon}>
                                <MapPin size={22} color="#3B82F6" strokeWidth={2} />
                            </View>
                            <View style={styles.savedAddressInfo}>
                                <Text style={styles.savedAddressTitle}>Alamat Tersimpan</Text>
                                <Text style={styles.savedAddressText}>{savedAddress}</Text>
                            </View>
                            <ChevronRight size={18} color="#CBD5E1" />
                        </TouchableOpacity>
                    )}

                    <View style={styles.notesInputRow}>
                        <MapPin size={16} color="#94A3B8" />
                        <TextInput
                            placeholder="Alamat lengkap (Nama jalan, No. Rumah, dll)"
                            style={styles.notesInput}
                            value={customerAddress}
                            onChangeText={setCustomerAddress}
                            multiline
                        />
                    </View>
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Metode Pembayaran</Text>

                    {/* Opsi Tunai */}
                    <TouchableOpacity
                        style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionActive]}
                        onPress={() => setPaymentMethod('cash')}
                    >
                        <View style={styles.paymentLeft}>
                            <View style={[styles.paymentIconWrap, paymentMethod === 'cash' && { backgroundColor: '#ECFDF5' }]}>
                                <Banknote size={20} color={paymentMethod === 'cash' ? "#059669" : "#64748B"} />
                            </View>
                            <View>
                                <Text style={[styles.paymentName, paymentMethod === 'cash' && { color: '#059669' }]}>Bayar Tunai</Text>
                                <Text style={styles.paymentDesc}>bayar ketika makanan sudah sampai</Text>
                            </View>
                        </View>
                        {paymentMethod === 'cash' && <CheckCircle2 size={20} color="#059669" />}
                    </TouchableOpacity>

                    {/* Opsi Qris (Mapped to Transfer internally) */}
                    <TouchableOpacity
                        style={[styles.paymentOption, paymentMethod === 'transfer' && styles.paymentOptionActive]}
                        onPress={() => setPaymentMethod('transfer')}
                    >
                        <View style={styles.paymentLeft}>
                            <View style={[styles.paymentIconWrap, paymentMethod === 'transfer' && { backgroundColor: '#EFF6FF' }]}>
                                <QrCode size={20} color={paymentMethod === 'transfer' ? "#2563EB" : "#64748B"} />
                            </View>
                            <View>
                                <Text style={[styles.paymentName, paymentMethod === 'transfer' && { color: '#2563EB' }]}>Bayar dengan Qris</Text>
                                <Text style={styles.paymentDesc}>Bayar dengan scan qris</Text>
                            </View>
                        </View>
                        {paymentMethod === 'transfer' && <CheckCircle2 size={20} color="#2563EB" />}
                    </TouchableOpacity>

                    {/* QRIS Display */}
                    {paymentMethod === 'transfer' && (
                        <View style={styles.qrisContainer}>
                            <Text style={styles.qrisTitle}>Scan Kode QRIS</Text>
                            <TouchableOpacity
                                style={styles.qrisImageWrapper}
                                onPress={() => setShowQrisModal(true)}
                                activeOpacity={0.9}
                            >
                                <Image
                                    source={require('../../../assets/qris.jpeg')}
                                    style={styles.qrisImage}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                            <Text style={styles.qrisInstruction}>
                                1. Buka aplikasi e-wallet atau mobile banking{'\n'}
                                2. Scan kode QRIS di atas{'\n'}
                                3. Periksa nominal dan selesaikan pembayaran
                            </Text>
                        </View>
                    )}
                </View>

                {/* Summary */}
                <View style={styles.summaryBox}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(cartTotal)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Biaya Layanan</Text>
                        <Text style={styles.summaryValue}>Rp 0</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total Pembayaran</Text>
                        <Text style={styles.totalValue}>{formatCurrency(cartTotal)}</Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Sticky Checkout Button */}
            <View style={styles.footer}>
                <View style={styles.footerLeft}>
                    <Text style={styles.footerLabel}>Total Bayar</Text>
                    <Text style={styles.footerValue}>{formatCurrency(cartTotal)}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.checkoutBtn, loading && styles.checkoutBtnDisabled]}
                    onPress={handleCheckout}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <>
                            <Text style={styles.checkoutBtnText}>Buat Pesanan</Text>
                            <ChevronRight size={20} color="#FFFFFF" />
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Full Screen QRIS Modal */}
            <Modal
                visible={showQrisModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowQrisModal(false)}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowQrisModal(false)}
                    />
                    <View style={styles.fullImageWrapper}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowQrisModal(false)}
                        >
                            <X size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.downloadButton}
                            onPress={handleDownloadQris}
                        >
                            <Download size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Image
                            source={require('../../../assets/qris.jpeg')}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : (Platform.OS === 'web' ? 15 : 20),
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    backBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    clearBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    cartItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    itemNameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
        maxWidth: '85%',
        marginBottom: 4,
    },
    itemOptions: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 2,
    },
    itemNote: {
        fontSize: 11,
        color: '#F59E0B',
        fontStyle: 'italic',
        marginTop: 2,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#059669',
    },
    qtyBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        padding: 2,
        borderRadius: 10,
        gap: 10,
    },
    qtyBtn: {
        width: 28,
        height: 28,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyVal: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
        minWidth: 20,
        textAlign: 'center',
    },
    notesInputRow: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 18,
        padding: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        gap: 10,
    },
    notesInput: {
        flex: 1,
        fontSize: 13,
        color: '#1E293B',
        height: 60,
        textAlignVertical: 'top',
    },
    paymentOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    paymentOptionActive: {
        borderColor: '#059669',
        backgroundColor: '#FFFFFF',
    },
    paymentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    paymentIconWrap: {
        width: 40,
        height: 40,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentName: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
    },
    paymentDesc: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    qrisContainer: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'center',
        marginTop: 10,
    },
    qrisTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 12,
    },
    qrisImageWrapper: {
        width: 200,
        height: 200,
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    qrisImage: {
        width: '100%',
        height: '100%',
    },
    qrisInstruction: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 18,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    fullImageWrapper: {
        width: width - 20,
        height: 500,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: -50,
        right: 0,
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    downloadButton: {
        position: 'absolute',
        top: -50,
        left: 0,
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        padding: 20,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 13,
        fontWeight: '900',
        color: '#1E293B',
    },
    totalRow: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        marginBottom: 0,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#059669',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIconWrap: {
        width: 120,
        height: 120,
        backgroundColor: '#F1F5F9',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
    },
    browseBtn: {
        backgroundColor: '#059669',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 18,
    },
    browseBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
    },
    footer: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px -10px 30px rgba(0,0,0,0.05)' },
            android: { elevation: 20 }
        })
    },
    footerLeft: {
        flex: 1,
    },
    footerLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '900',
        letterSpacing: 1,
    },
    footerValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#059669',
    },
    savedAddressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    savedAddressIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    savedAddressInfo: {
        flex: 1,
    },
    savedAddressTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
    },
    savedAddressText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
        fontWeight: 'bold',
    },
    checkoutBtn: {
        flex: 1.2,
        backgroundColor: '#059669',
        height: 54,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    checkoutBtnDisabled: {
        backgroundColor: '#CBD5E1',
    },
    checkoutBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    }
});

export default CustomerCart;
