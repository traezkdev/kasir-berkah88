import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Linking,
    StatusBar,
    Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Plus,
    Minus,
    ShoppingCart,
    Trash2,
    ArrowLeft,
    MapPin,
    User,
    Info,
    CheckCircle2
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiService, { API_URL } from '../../api/apiService';
import AppImage from '../../components/AppImage';

const { width } = Dimensions.get('window');

const GuestCheckoutScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(true);
    const [customerName, setCustomerName] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [globalIgnoreStock, setGlobalIgnoreStock] = useState(false);
    const [activeCategory, setActiveCategory] = useState('Semua');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [menuRes, settingsRes] = await Promise.all([
                apiService.get('/api/guest/menu-items'),
                apiService.get('/api/restaurant-settings').catch(() => ({ data: { data: { ignore_stock: 0 } } }))
            ]);

            if (menuRes.data.message === 'success') {
                setMenuItems(menuRes.data.data);
            }

            if (settingsRes.data.message === 'success' || settingsRes.data.data) {
                setGlobalIgnoreStock(!!settingsRes.data.data.ignore_stock);
            }
        } catch (error) {
            console.error('Error fetching guest data:', error);
            Alert.alert('Gagal', 'Terjadi kesalahan saat memuat menu.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (item) => {
        const currentQty = cart[item.id] || 0;

        // Stock validation if not ignoring stock
        if (!globalIgnoreStock && item.stock !== null && currentQty >= item.stock) {
            Alert.alert('Stok Habis', `Maaf, stok ${item.name} sudah tidak mencukupi.`);
            return;
        }

        setCart(prev => ({
            ...prev,
            [item.id]: currentQty + 1
        }));
    };

    const handleRemoveFromCart = (item) => {
        setCart(prev => {
            const newQty = (prev[item.id] || 0) - 1;
            if (newQty <= 0) {
                const newCart = { ...prev };
                delete newCart[item.id];
                return newCart;
            }
            return { ...prev, [item.id]: newQty };
        });
    };

    const calculateTotal = () => {
        return Object.entries(cart).reduce((total, [itemId, quantity]) => {
            const item = menuItems.find(m => m.id.toString() === itemId.toString());
            if (!item) return total;
            const discountedPrice = item.price * (1 - (item.discount || 0));
            return total + (discountedPrice * quantity);
        }, 0);
    };

    const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

    const handleCheckout = async () => {
        if (totalItems === 0) {
            Alert.alert('Keranjang Kosong', 'Silakan pilih menu terlebih dahulu.');
            return;
        }
        if (!customerName.trim() || !customerAddress.trim()) {
            Alert.alert('Data Belum Lengkap', 'Mohon isi nama dan alamat pengiriman Anda.');
            return;
        }

        setIsSubmitting(true);

        const orderItems = Object.entries(cart).map(([itemId, quantity]) => {
            const item = menuItems.find(m => m.id.toString() === itemId.toString());
            return item ? { id: item.id, name: item.name, price: item.price, quantity } : null;
        }).filter(Boolean);

        const orderData = {
            customer_name: customerName,
            customer_address: customerAddress,
            items: orderItems,
            total: calculateTotal(),
        };

        try {
            // 1. Submit order to backend for verification
            const response = await apiService.post('/api/orders', orderData);

            if (response.status === 201) {
                // 2. Format WhatsApp message
                let whatsappMessage = `*Pesan Baru (Guest Checkout)*\n\n`;
                whatsappMessage += `👤 *Nama:* ${customerName}\n`;
                whatsappMessage += `📍 *Alamat:* ${customerAddress}\n`;
                whatsappMessage += `-----------------------------------\n`;
                whatsappMessage += "*Daftar Pesanan:*\n";

                orderItems.forEach(item => {
                    const originalItemTotal = item.price * item.quantity;
                    const menu = menuItems.find(m => m.id === item.id);
                    const discount = menu?.discount || 0;
                    const discountedItemTotal = (item.price * (1 - discount)) * item.quantity;

                    whatsappMessage += `- ${item.quantity}x ${item.name}`;
                    if (discount > 0) {
                        whatsappMessage += ` (Disc ${Math.round(discount * 100)}%)`;
                        whatsappMessage += ` (Rp ${discountedItemTotal.toLocaleString('id-ID')})\n`;
                    } else {
                        whatsappMessage += ` (Rp ${originalItemTotal.toLocaleString('id-ID')})\n`;
                    }
                });

                whatsappMessage += `-----------------------------------\n`;
                whatsappMessage += `💰 *Total Akhir: Rp ${calculateTotal().toLocaleString('id-ID')}*\n\n`;
                whatsappMessage += "Mohon segera diproses ya, terima kasih! 🙏";

                const whatsappNumber = "6285864875536"; // Configurable number
                const encodedMessage = encodeURIComponent(whatsappMessage);
                const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

                const supported = await Linking.canOpenURL(whatsappUrl);
                if (supported) {
                    await Linking.openURL(whatsappUrl);
                    Alert.alert('Berhasil', 'Pesanan Anda telah dicatat. Silakan lanjutkan pesan via WhatsApp.', [
                        { text: 'OK', onPress: () => navigation.replace('Welcome') }
                    ]);
                } else {
                    Alert.alert('Error', 'Gagal membuka WhatsApp. Mohon pastikan WhatsApp terpasang.');
                }
            }
        } catch (error) {
            console.error('Checkout error:', error);
            Alert.alert('Gagal', error.response?.data?.error || 'Terjadi kesalahan saat memesan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const categories = ['Semua', ...new Set(menuItems.map(item => item.category))].filter(Boolean);
    const filteredItems = activeCategory === 'Semua'
        ? menuItems
        : menuItems.filter(item => item.category === activeCategory);

    const renderMenuItem = ({ item }) => {
        const qty = cart[item.id] || 0;
        const discount = item.discount || 0;
        const priceAfterDiscount = item.price * (1 - discount);
        const isOutOfStock = !globalIgnoreStock && item.stock !== null && item.stock <= 0;

        return (
            <View style={styles.menuCard}>
                <View style={styles.imageContainer}>
                    <AppImage
                        uri={item.image_url}
                        style={styles.menuImage}
                    />
                    {discount > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>-{Math.round(discount * 100)}%</Text>
                        </View>
                    )}
                    {isOutOfStock && (
                        <View style={styles.outOfStockOverlay}>
                            <Text style={styles.outOfStockText}>HABIS</Text>
                        </View>
                    )}
                </View>

                <View style={styles.menuInfo}>
                    <Text style={styles.menuName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.menuCategory}>{item.category || 'Lainnya'}</Text>

                    <View style={styles.priceRow}>
                        <View>
                            {discount > 0 && (
                                <Text style={styles.originalPrice}>Rp {item.price.toLocaleString('id-ID')}</Text>
                            )}
                            <Text style={styles.currentPrice}>Rp {priceAfterDiscount.toLocaleString('id-ID')}</Text>
                        </View>

                        <View style={styles.stockInfo}>
                            {globalIgnoreStock ? (
                                <Text style={styles.stockText}>Stok: ∞</Text>
                            ) : (
                                <Text style={styles.stockText}>Stok: {item.stock}</Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.actionContainer}>
                        {qty > 0 ? (
                            <View style={styles.qtyContainer}>
                                <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => handleRemoveFromCart(item)}
                                >
                                    <Minus size={16} color="#059669" strokeWidth={2.5} />
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>{qty}</Text>
                                <TouchableOpacity
                                    style={[styles.qtyBtn, (isOutOfStock || (!globalIgnoreStock && qty >= item.stock)) && styles.disabledBtn]}
                                    onPress={() => handleAddToCart(item)}
                                    disabled={isOutOfStock || (!globalIgnoreStock && qty >= item.stock)}
                                >
                                    <Plus size={16} color="#059669" strokeWidth={2.5} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.addBtn, isOutOfStock && styles.disabledBtn]}
                                onPress={() => handleAddToCart(item)}
                                disabled={isOutOfStock}
                            >
                                <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
                                <Text style={styles.addBtnText}>TAMBAH</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#059669" />
                <Text style={styles.loadingText}>Menyiapkan Menu Berkah...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#059669" />

            {/* Header */}
            <LinearGradient colors={['#059669', '#10B981']} style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Pesan Delivery</Text>
                        <Text style={styles.headerSubtitle}>Tamu Berkah 88</Text>
                    </View>
                    <View style={styles.cartBadgeContainer}>
                        <ShoppingCart size={24} color="#FFFFFF" />
                        {totalItems > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{totalItems}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Categories */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScroll}
                >
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.categoryTab, activeCategory === cat && styles.activeCategoryTab]}
                            onPress={() => setActiveCategory(cat)}
                        >
                            <Text style={[styles.categoryTabText, activeCategory === cat && styles.activeCategoryTabText]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <FlatList
                    data={filteredItems}
                    renderItem={renderMenuItem}
                    keyExtractor={item => item.id.toString()}
                    numColumns={2}
                    contentContainerStyle={styles.menuList}
                    ListHeaderComponent={
                        <View style={styles.formSection}>
                            <View style={styles.sectionHeader}>
                                <Info size={18} color="#059669" />
                                <Text style={styles.sectionTitle}>Informasi Pengiriman</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputWrapper}>
                                    <User size={18} color="#94A3B8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nama Lengkap Anda"
                                        value={customerName}
                                        onChangeText={setCustomerName}
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>
                                <View style={styles.inputWrapper}>
                                    <MapPin size={18} color="#94A3B8" style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        placeholder="Alamat Pengiriman Lengkap"
                                        value={customerAddress}
                                        onChangeText={setCustomerAddress}
                                        multiline
                                        numberOfLines={2}
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Info size={48} color="#CBD5E1" />
                            <Text style={styles.emptyText}>Menu belum tersedia</Text>
                        </View>
                    }
                />
            </KeyboardAvoidingView>

            {/* Bottom Bar */}
            {totalItems > 0 && (
                <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <View style={styles.totalInfo}>
                        <View>
                            <Text style={styles.totalLabel}>Total Pembayaran</Text>
                            <Text style={styles.totalAmount}>Rp {calculateTotal().toLocaleString('id-ID')}</Text>
                        </View>
                        <View style={styles.itemCountBadge}>
                            <Text style={styles.itemCountText}>{totalItems} Item</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.checkoutBtn}
                        onPress={handleCheckout}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <>
                                <WhatsAppIcon />
                                <Text style={styles.checkoutBtnText}>PESAN VIA WHATSAPP</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const WhatsAppIcon = () => (
    <Image
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/733/733585.png' }}
        style={{ width: 20, height: 20, marginRight: 8, tintColor: '#FFFFFF' }}
    />
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 15,
        color: '#059669',
        fontWeight: '700',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 15,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
    },
    cartBadgeContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#EF4444',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#059669',
    },
    cartBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
    },
    categoryScroll: {
        paddingRight: 20,
    },
    categoryTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginRight: 10,
    },
    activeCategoryTab: {
        backgroundColor: '#FFFFFF',
    },
    categoryTabText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    activeCategoryTabText: {
        color: '#059669',
    },
    menuList: {
        padding: 12,
        paddingBottom: 100,
    },
    formSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
    },
    inputGroup: {
        gap: 12,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '600',
    },
    textArea: {
        height: 70,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    menuCard: {
        flex: 0.5,
        backgroundColor: '#FFFFFF',
        margin: 6,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Platform.select({
            web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' },
            android: { elevation: 3 }
        })
    },
    imageContainer: {
        width: '100%',
        height: 120,
        backgroundColor: '#F1F5F9',
    },
    menuImage: {
        width: '100%',
        height: '100%',
    },
    discountBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
    },
    outOfStockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    outOfStockText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    menuInfo: {
        padding: 12,
    },
    menuName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
        height: 38,
        lineHeight: 18,
    },
    menuCategory: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 2,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginVertical: 10,
    },
    currentPrice: {
        fontSize: 15,
        fontWeight: '900',
        color: '#059669',
    },
    originalPrice: {
        fontSize: 10,
        color: '#94A3B8',
        textDecorationLine: 'line-through',
    },
    stockInfo: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    stockText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#64748B',
    },
    actionContainer: {
        marginTop: 4,
    },
    addBtn: {
        backgroundColor: '#059669',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 36,
        borderRadius: 18,
        gap: 4,
    },
    addBtnText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '900',
    },
    qtyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ECFDF5',
        borderRadius: 18,
        height: 36,
        paddingHorizontal: 4,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    qtyBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#059669',
    },
    disabledBtn: {
        backgroundColor: '#E2E8F0',
        opacity: 0.7,
    },
    emptyContainer: {
        padding: 50,
        alignItems: 'center',
        gap: 15,
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px -4px 20px rgba(0,0,0,0.1)' },
            android: { elevation: 20 }
        })
    },
    totalInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    totalLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '700',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: '900',
        color: '#059669',
    },
    itemCountBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    itemCountText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: '800',
    },
    checkoutBtn: {
        backgroundColor: '#10B981',
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkoutBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
    }
});

export default GuestCheckoutScreen;
