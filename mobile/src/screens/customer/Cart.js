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
    TextInput,
    Alert,
    Modal,
    Switch
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSafeBottomPadding } from '../../utils/safeArea';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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
    XCircle,
    Download,
    Phone
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as MediaLibrary from 'expo-media-library';
import { Asset } from 'expo-asset';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import apiService, { API_URL } from '../../api/apiService';
import usePopups from '../../hooks/usePopups';
import PopupModal from '../../components/PopupModal';
import AppImage from '../../components/AppImage';

const { width } = Dimensions.get('window');

// Memoized Cart Item to prevent full list re-renders (Anti-Delay)
const CartItem = React.memo(({ item, updateQuantity, handleRemoveItem, formatCurrency }) => {
    return (
        <View style={styles.cartItem}>
            <AppImage
                uri={item.image_url}
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
    const insets = useSafeAreaInsets();
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
    const { popups } = usePopups('cart');

    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [savedAddress, setSavedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [showQrisModal, setShowQrisModal] = useState(false);

    // Points System
    const [points, setPoints] = useState(0);
    const [usePoints, setUsePoints] = useState(false);

    // Promo System
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [validatingPromo, setValidatingPromo] = useState(false);

    // Custom Error Modal State
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorModalContent, setErrorModalContent] = useState({ title: '', message: '' });

    // Delivery Data Type Selection
    const [deliveryDataType, setDeliveryDataType] = useState('profile'); // 'profile' or 'new'
    const [profilePhone, setProfilePhone] = useState('');

    const showError = (title, message) => {
        setErrorModalContent({ title, message });
        setErrorModalVisible(true);
    };

    const pointsToUse = usePoints
        ? Math.min(points, cartTotal)
        : 0;

    // Calculate Promo Discount
    let promoDiscountAmount = 0;
    if (appliedPromo) {
        if (appliedPromo.discount_type === 'percentage') {
            promoDiscountAmount = (cartTotal * parseFloat(appliedPromo.discount_value)) / 100;
        } else {
            promoDiscountAmount = parseFloat(appliedPromo.discount_value);
        }
    }

    const finalTotal = Math.max(0, cartTotal - pointsToUse - promoDiscountAmount);

    // Fetch user profile to get saved address and points
    useFocusEffect(
        useCallback(() => {
            const fetchUserProfile = async () => {
                try {
                    const response = await apiService.get('/api/user/profile');
                    if (response.data.message === 'success') {
                        if (response.data.data.address) {
                            setSavedAddress(response.data.data.address);
                        }
                        if (response.data.data.phone) {
                            setProfilePhone(response.data.data.phone);
                        }
                        // Fetch fresh user data (points are in users table, but profile endpoint returns user data)
                        // Actually typically profile returns points too if columns are selected.
                        // Let's check server.js profile endpoint. It returns: id, username, role, avatar_url, phone, address
                        // It does NOT return points. I need to fetch points separately or update profile endpoint.
                        // Alternatively, use /api/customers/search logic? 
                        // Or just update profile endpoint.
                        // Let's try to update profile endpoint in next step if needed, but for now I'll assume I can fetch it.
                        // Wait, I can't fetch points from profile endpoint as strictly seen in server.js earlier.
                        // I will add points to the SELECT query in server.js as a quick fix or use a separate call.
                        // Better: make a specific call or rely on valid endpoint.
                        // Let's try fetching from /api/user/profile again, assuming I will update backend to include points.
                        if (response.data.data.points !== undefined) {
                            setPoints(parseFloat(response.data.data.points));
                        }
                    } else {
                        setSavedAddress(null);
                    }

                    // Separate call to be sure if profile doesn't have it yet? 
                    // Let's use a specialized endpoint if we can, but profile is best place.
                    // I will add 'points' to the profile endpoint in server.js in a separate tool call if needed.
                    // Actually, let's just do it.
                } catch (error) {
                    console.error("Error fetching profile:", error);
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

    // Reactive check for Min Purchase
    useEffect(() => {
        if (appliedPromo && cartTotal > 0) {
            const rawMin = appliedPromo.min_purchase;
            let minReq = 0;

            if (typeof rawMin === 'number') {
                minReq = rawMin;
            } else if (rawMin) {
                let str = rawMin.toString().trim();
                if (str.includes('.') && str.includes(',')) {
                    minReq = str.indexOf('.') < str.indexOf(',') ? parseFloat(str.replace(/\./g, '').replace(/,/g, '.')) : parseFloat(str.replace(/,/g, ''));
                } else if (str.includes(',') && str.split(',')[str.split(',').length - 1].length === 3) {
                    minReq = parseFloat(str.replace(/,/g, ''));
                } else if (str.includes('.') && str.split('.')[str.split('.').length - 1].length === 3) {
                    minReq = parseFloat(str.replace(/\./g, ''));
                } else {
                    minReq = parseFloat(str.replace(/[^\d.-]/g, '')) || 0;
                }
            }

            console.log('Reactive Check:', { cartTotal, minReq });
            if (cartTotal < minReq) {
                // showToast(`Promo dicopot. TOTAL: ${cartTotal} < MIN: ${minReq}`, 'info');
                setAppliedPromo(null);
            }
        }
    }, [cartTotal, appliedPromo]);

    const handleValidatePromo = async () => {
        if (!promoCode.trim()) return;

        setValidatingPromo(true);
        try {
            const response = await apiService.post('/api/promos/validate', {
                code: promoCode,
                total: cartTotal
            });
            if (response.data && response.data.data) {
                setAppliedPromo(response.data.data);
                showToast('Promo berhasil diterapkan!', 'success');
            }
        } catch (error) {
            console.error('Promo error:', error);
            const errMsg = error.response?.data?.error || 'Kode promo tidak valid';
            showError('Gagal Menggunakan Promo', errMsg);
            setAppliedPromo(null);
        } finally {
            setValidatingPromo(false);
        }
    };

    const removePromo = () => {
        setAppliedPromo(null);
        setPromoCode('');
    };

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

        const currentAddress = deliveryDataType === 'profile' ? savedAddress : customerAddress;
        const currentPhone = deliveryDataType === 'profile' ? profilePhone : customerPhone;

        if (!currentAddress || !currentAddress.trim()) {
            showToast('Alamat pengiriman wajib diisi!', 'error');
            return;
        }

        if (!currentPhone || !currentPhone.trim()) {
            showToast('Nomor telepon wajib diisi!', 'error');
            return;
        }

        const totalSavings = pointsToUse + promoDiscountAmount;
        const accepted = await confirm({
            title: 'Konfirmasi Pesanan',
            message: `Total belanja Anda adalah ${formatCurrency(finalTotal)} ${totalSavings > 0 ? `(Hemat ${formatCurrency(totalSavings)})` : ''}. Lanjutkan pemesanan?`,
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
                customer_address: deliveryDataType === 'profile' ? savedAddress : customerAddress,
                customer_phone: deliveryDataType === 'profile' ? profilePhone : customerPhone,
                customer_name: user?.username || user?.name || 'Pelanggan',
                pointsUsed: usePoints ? pointsToUse : 0,
                promoId: appliedPromo ? appliedPromo.id : null
            };

            const response = await apiService.post('/api/orders', payload);

            // Backend returns 201 Created and detailed message
            if (response.status === 201 || (response.data && response.data.data)) {
                showToast('Pesanan berhasil dibuat! Silakan tunggu konfirmasi.', 'success');
                clearCart();
                setAppliedPromo(null);
                // Navigate to OrderDetails with the new ID
                navigation.navigate('OrderDetails', { orderId: response.data.data.id });
            } else {
                throw new Error(response.data.error || 'Gagal membuat pesanan');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            const serverMessage = error.response?.data?.error;
            const finalMsg = serverMessage || error.message || 'Gagal memproses pesanan. Silakan coba lagi.';

            // Jika error dari server terkait promo atau validasi, tampilkan popup Custom
            if (serverMessage) {
                showError('Pesanan Gagal', finalMsg);
            } else {
                showToast(finalMsg, 'error');
            }
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
                    <Text style={styles.emptyTitle}>Wah, Masih Kosong Nih</Text>
                    <Text style={styles.emptySubtitle}>Yuk, isi dengan menu favoritmu biar berkah!</Text>
                    <TouchableOpacity
                        style={styles.browseBtn}
                        onPress={() => navigation.navigate('Menu')}
                    >
                        <Text style={styles.browseBtnText}>Cari Menu Bismillah</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={20} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pesanan Berkah Kamu</Text>
                <TouchableOpacity onPress={() => clearCart()} style={styles.clearBtn}>
                    <Trash2 size={18} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            <KeyboardAwareScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={100} // Memberikan ruang ekstra di atas keyboard
            >
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Daftar Pesanan Berkah</Text>
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

                <View style={styles.divider} />

                {/* Delivery Notes */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Request Tambahan (Opsional)</Text>
                    <View style={[styles.notesInputRow, { alignItems: 'flex-start', paddingVertical: 14 }]}>
                        <Info size={18} color="#94A3B8" style={{ marginTop: 12 }} />
                        <TextInput
                            placeholder="Bismillah, request-nya apa nih? (Contoh: Gak pake sambel ya)"
                            style={[styles.notesInput, { minHeight: 80, textAlignVertical: 'top', paddingTop: 8 }]}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                        />
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Delivery Address */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>
                        Tujuan Pengiriman <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>

                    {/* Delivery Type Selector */}
                    <View style={styles.deliverySelector}>
                        <TouchableOpacity
                            style={[styles.deliveryOption, deliveryDataType === 'profile' && styles.deliveryOptionActive]}
                            onPress={() => setDeliveryDataType('profile')}
                        >
                            <View style={[styles.radioOutline, deliveryDataType === 'profile' && styles.radioActive]}>
                                {deliveryDataType === 'profile' && <View style={styles.radioInner} />}
                            </View>
                            <Text style={[styles.deliveryOptionText, deliveryDataType === 'profile' && styles.deliveryOptionTextActive]}>Sesuai Profil</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.deliveryOption, deliveryDataType === 'new' && styles.deliveryOptionActive]}
                            onPress={() => setDeliveryDataType('new')}
                        >
                            <View style={[styles.radioOutline, deliveryDataType === 'new' && styles.radioActive]}>
                                {deliveryDataType === 'new' && <View style={styles.radioInner} />}
                            </View>
                            <Text style={[styles.deliveryOptionText, deliveryDataType === 'new' && styles.deliveryOptionTextActive]}>Alamat Baru</Text>
                        </TouchableOpacity>
                    </View>

                    {deliveryDataType === 'profile' ? (
                        <View style={styles.profileDataCard}>
                            <View style={styles.profileDataItem}>
                                <View style={styles.profileDataIcon}>
                                    <Phone size={16} color="#3B82F6" />
                                </View>
                                <View>
                                    <Text style={styles.profileDataLabel}>Nomor WA Aktif</Text>
                                    <Text style={styles.profileDataValue}>{profilePhone || 'Belum diatur'}</Text>
                                </View>
                            </View>
                            <View style={[styles.profileDataItem, { marginBottom: 0, borderBottomWidth: 0, paddingBottom: 0 }]}>
                                <View style={styles.profileDataIcon}>
                                    <MapPin size={16} color="#3B82F6" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.profileDataLabel}>Alamat Pengiriman</Text>
                                    <Text style={styles.profileDataValue}>{savedAddress || 'Belum diatur'}</Text>
                                </View>
                            </View>
                            {(!profilePhone || !savedAddress) && (
                                <TouchableOpacity
                                    style={styles.editProfileBtn}
                                    onPress={() => navigation.navigate('Profile')}
                                >
                                    <Text style={styles.editProfileBtnText}>Lengkapi Profil Sekarang</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <>
                            {/* Phone Input */}
                            <View style={[styles.notesInputRow, { marginBottom: 10 }]}>
                                <Phone size={18} color="#94A3B8" />
                                <TextInput
                                    placeholder="Nomor Telepon / WhatsApp"
                                    style={[styles.notesInput, { height: 48, paddingVertical: 0 }]}
                                    value={customerPhone}
                                    onChangeText={setCustomerPhone}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={[styles.notesInputRow, { alignItems: 'flex-start', paddingVertical: 14 }]}>
                                <MapPin size={18} color="#94A3B8" style={{ marginTop: 12 }} />
                                <TextInput
                                    placeholder="Alamat lengkap (Nama jalan, No. Rumah, dll)"
                                    style={[styles.notesInput, { minHeight: 100, textAlignVertical: 'top', paddingTop: 8 }]}
                                    value={customerAddress}
                                    onChangeText={setCustomerAddress}
                                    multiline
                                />
                            </View>
                        </>
                    )}
                </View>

                <View style={styles.divider} />

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Metode Pembayaran</Text>

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
                                <Text style={[styles.paymentName, paymentMethod === 'cash' && { color: '#059669' }]}>Bayar Cash (COD)</Text>
                                <Text style={styles.paymentDesc}>bayar santai pas makanan nyampe</Text>
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
                                <Text style={[styles.paymentName, paymentMethod === 'transfer' && { color: '#2563EB' }]}>Scan QRIS Berkah</Text>
                                <Text style={styles.paymentDesc}>Biar praktis bin berkah</Text>
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

                {/* Points Redemption Section */}
                {points > 0 && (
                    <>
                        <View style={styles.divider} />
                        <View style={styles.section}>
                            <View style={styles.pointsSectionHeader}>
                                <View style={styles.pointsHeaderIcon}>
                                    <Text style={styles.pointsHeaderEmoji}>💎</Text>
                                </View>
                                <View style={styles.pointsHeaderText}>
                                    <Text style={styles.sectionTitle}>Tukar Poin Berkah</Text>
                                    <Text style={styles.pointsHeaderSubtitle}>Alhamdulillah, poin bisa buat jajan hemat!</Text>
                                </View>
                            </View>

                            <View style={styles.pointsCard}>
                                <View style={styles.pointsCardGradient}>
                                    <View style={styles.pointsCardContent}>
                                        <View style={styles.pointsMainRow}>
                                            <View style={styles.pointsLeft}>
                                                <View style={styles.pointsBadge}>
                                                    <Text style={styles.pointsBadgeText}>SISA POIN</Text>
                                                </View>
                                                <Text style={styles.pointsValue}>{points.toLocaleString('id-ID')}</Text>
                                                <Text style={styles.pointsValueLabel}>Siap dipakai nih</Text>
                                            </View>

                                            <View style={styles.pointsRight}>
                                                <View style={styles.switchContainer}>
                                                    <Text style={styles.switchLabel}>{usePoints ? 'AKTIF' : 'NONAKTIF'}</Text>
                                                    <Switch
                                                        value={usePoints}
                                                        onValueChange={setUsePoints}
                                                        trackColor={{ false: '#CBD5E1', true: '#34D399' }}
                                                        thumbColor={usePoints ? '#FFFFFF' : '#F1F5F9'}
                                                        ios_backgroundColor="#CBD5E1"
                                                    />
                                                </View>
                                            </View>
                                        </View>

                                        <View style={styles.pointsEquivalentBox}>
                                            <Text style={styles.pointsEquivalentLabel}>Setara dengan</Text>
                                            <Text style={styles.pointsEquivalent}>{formatCurrency(points)}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {usePoints && pointsToUse > 0 && (
                                <View style={styles.pointsActiveNotice}>
                                    <View style={styles.pointsActiveIcon}>
                                        <Text style={styles.pointsActiveIconText}>✓</Text>
                                    </View>
                                    <View style={styles.pointsActiveContent}>
                                        <Text style={styles.pointsActiveTitle}>Alhamdulillah, Poin Terpakai</Text>
                                        <Text style={styles.pointsActiveDesc}>
                                            Kamu menghemat <Text style={styles.pointsActiveAmount}>{formatCurrency(pointsToUse)}</Text> dengan {pointsToUse.toLocaleString('id-ID')} poin
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </>
                )}

                <View style={styles.divider} />

                {/* Promo Code Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Pake Kode Promo</Text>
                    {appliedPromo ? (
                        <View style={styles.appliedPromoBox}>
                            <View style={styles.promoInfo}>
                                <View style={styles.promoIconActive}>
                                    <Ticket size={24} color="#059669" />
                                </View>
                                <View>
                                    <Text style={styles.appliedPromoTitle}>{appliedPromo.title}</Text>
                                    <Text style={styles.appliedPromoCode}>Kode: {appliedPromo.code}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={removePromo} style={styles.removePromoBtn}>
                                <X size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.promoInputRow}>
                            <Ticket size={20} color="#94A3B8" />
                            <TextInput
                                placeholder="Ketik kode promo di sini..."
                                style={styles.promoInput}
                                value={promoCode}
                                onChangeText={setPromoCode}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity
                                style={[styles.applyPromoBtn, (!promoCode || validatingPromo) && styles.applyPromoBtnDisabled]}
                                onPress={handleValidatePromo}
                                disabled={!promoCode || validatingPromo}
                            >
                                {validatingPromo ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.applyPromoBtnText}>GAS</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={styles.divider} />

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
                    {usePoints && pointsToUse > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: '#0284C7' }]}>Potongan Poin</Text>
                            <Text style={[styles.summaryValue, { color: '#0284C7' }]}>-{formatCurrency(pointsToUse)}</Text>
                        </View>
                    )}
                    {appliedPromo && promoDiscountAmount > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: '#059669' }]}>Diskon Promo</Text>
                            <Text style={[styles.summaryValue, { color: '#059669' }]}>-{formatCurrency(promoDiscountAmount)}</Text>
                        </View>
                    )}
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total Semuanya</Text>
                        <Text style={styles.totalValue}>{formatCurrency(finalTotal)}</Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </KeyboardAwareScrollView>

            {/* Sticky Checkout Button - Outside Scroll, but inside SafeArea */}
            <View style={[styles.footer, { paddingBottom: getSafeBottomPadding(insets, -18, 20) }]}>
                <View style={styles.footerLeft}>
                    <Text style={styles.footerLabel}>Total</Text>
                    <Text style={styles.footerValue}>{formatCurrency(finalTotal)}</Text>
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
                            <Text style={styles.checkoutBtnText}>Bismillah, Pesan Sekarang</Text>
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

            {/* Premium Custom Error Modal */}
            <Modal
                visible={errorModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setErrorModalVisible(false)}
            >
                <View style={styles.alertOverlay}>
                    <View style={styles.alertCard}>
                        <View style={styles.alertIconBg}>
                            <XCircle size={32} color="#EF4444" />
                        </View>
                        <Text style={styles.alertTitleText}>{errorModalContent.title}</Text>
                        <Text style={styles.alertMessageText}>{errorModalContent.message}</Text>
                        <TouchableOpacity
                            style={styles.alertCloseBtn}
                            onPress={() => setErrorModalVisible(false)}
                        >
                            <Text style={styles.alertCloseBtnText}>TUTUP</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            {/* Popup System */}
            <PopupModal
                popups={popups}
                currentPage="cart"
                onClose={(screenName) => {
                    if (screenName) {
                        navigation.navigate(screenName);
                    }
                }}
            />
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
    },
    scrollContent: {
        paddingHorizontal: 20, // Tambahkan padding horizontal agar tidak nempel layar
        paddingTop: 16,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 16,
    },
    divider: {
        height: 6,
        backgroundColor: '#F8FAFC',
        marginHorizontal: -20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
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
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        gap: 12,
    },
    notesInput: {
        flex: 1,
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '600',
        paddingVertical: 8,
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
    // Points Styles - Premium Design
    pointsSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    pointsHeaderIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pointsHeaderEmoji: {
        fontSize: 24,
    },
    pointsHeaderText: {
        flex: 1,
    },
    pointsHeaderSubtitle: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
    pointsCard: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    pointsCardGradient: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#E0F2FE',
        borderRadius: 24,
    },
    pointsCardContent: {
        padding: 20,
    },
    pointsMainRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    pointsLeft: {
        flex: 1,
    },
    pointsBadge: {
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    pointsBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#1E40AF',
        letterSpacing: 1,
    },
    pointsValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0284C7',
        marginBottom: 4,
    },
    pointsValueLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 12,
    },
    pointsEquivalentBox: {
        backgroundColor: '#F0F9FF',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    pointsEquivalentLabel: {
        fontSize: 10,
        color: '#0369A1',
        fontWeight: '600',
        marginBottom: 4,
    },
    pointsEquivalent: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0284C7',
    },
    pointsRight: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    switchContainer: {
        alignItems: 'center',
        gap: 8,
    },
    switchLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1,
    },
    pointsActiveNotice: {
        flexDirection: 'row',
        backgroundColor: '#ECFDF5',
        padding: 16,
        borderRadius: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        gap: 12,
    },
    pointsActiveIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pointsActiveIconText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '900',
    },
    pointsActiveContent: {
        flex: 1,
        justifyContent: 'center',
    },
    pointsActiveTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: '#059669',
        marginBottom: 4,
    },
    pointsActiveDesc: {
        fontSize: 12,
        color: '#047857',
        fontWeight: '600',
        lineHeight: 18,
    },
    pointsActiveAmount: {
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
    },
    // Promo Styles
    promoInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        gap: 12,
    },
    promoInput: {
        flex: 1,
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '900',
        paddingVertical: 8,
    },
    applyPromoBtn: {
        backgroundColor: '#059669',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    applyPromoBtnDisabled: {
        backgroundColor: '#CBD5E1',
    },
    applyPromoBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
    },
    appliedPromoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ECFDF5',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    promoInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    promoIconActive: {
        width: 44,
        height: 44,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appliedPromoTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#059669',
    },
    appliedPromoCode: {
        fontSize: 12,
        fontWeight: '700',
        color: '#047857',
        marginTop: 2,
    },
    removePromoBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Custom Alert Modal Styles
    alertOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    alertCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 24,
        alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0px 20px 50px rgba(0,0,0,0.3)' },
            android: { elevation: 20 }
        })
    },
    alertIconBg: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    alertTitleText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    alertMessageText: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    alertCloseBtn: {
        width: '100%',
        height: 56,
        backgroundColor: '#1E293B', // Dark slate for premium look
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0px 4px 12px rgba(30, 41, 59, 0.3)' },
            android: { elevation: 4 }
        })
    },
    alertCloseBtnText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    // Delivery Selector Styles
    deliverySelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    deliveryOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        gap: 8,
    },
    deliveryOptionActive: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    radioOutline: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioActive: {
        borderColor: '#3B82F6',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#3B82F6',
    },
    deliveryOptionText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
    },
    deliveryOptionTextActive: {
        color: '#1E40AF',
    },
    profileDataCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    profileDataItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 12,
    },
    profileDataIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileDataLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    profileDataValue: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '700',
        marginTop: 2,
    },
    editProfileBtn: {
        marginTop: 12,
        backgroundColor: '#F1F5F9',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    editProfileBtnText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: 'bold',
    },
});

export default CustomerCart;
