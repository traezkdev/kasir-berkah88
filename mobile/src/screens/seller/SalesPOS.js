import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    Alert,
    useWindowDimensions,
    Platform,
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    RefreshControl,
    Switch,
    StatusBar,
    Pressable,
    InteractionManager
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSafeBottomPadding } from '../../utils/safeArea';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    X,
    Check,
    ChevronDown,
    QrCode,
    Banknote,
    PackageX,
    ArrowRight,
    LayoutGrid,
    List
} from 'lucide-react-native';
// LinearGradient removed to avoid native module errors
import apiService, { API_URL } from '../../api/apiService';
import ReceiptModal from '../../components/ReceiptModal';
import ModernLoader from '../../components/ModernLoader';
import { useConfirm } from '../../context/ConfirmContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useOrderNotification } from '../../context/OrderNotificationContext';

// Komponen Item yang dimemoize untuk performa (Anti-Delay)
const ProductCardItem = React.memo(({ item, qty, addToCart, ignoreStock, formatCurrency, isOutOfStock, viewMode }) => {
    const isList = viewMode === 'list';

    return (
        <Pressable
            style={({ pressed }) => [
                isList ? styles.productCardList : styles.productCard,
                isOutOfStock && !ignoreStock && styles.outOfStockCard,
                qty > 0 && styles.selectedProductCard,
                pressed && { transform: [{ scale: 0.98 }] }
            ]}
            onPress={() => (ignoreStock || !isOutOfStock) && addToCart(item)}
            disabled={isOutOfStock && !ignoreStock}
        >
            <View style={isList ? styles.imageWrapperList : styles.imageWrapper}>
                {item.image_url ? (
                    <Image
                        source={{ uri: `${API_URL}${item.image_url}` }}
                        style={styles.productImage}
                    />
                ) : (
                    <View style={styles.placeholderImg}>
                        <ShoppingCart size={isList ? 24 : 30} color="#CBD5E1" />
                    </View>
                )}
                {item.discount > 0 && (
                    <View style={isList ? styles.discountBadgeList : styles.discountBadge}>
                        <Text style={styles.discountText}>{Math.round(item.discount)}%</Text>
                    </View>
                )}
            </View>

            <View style={isList ? styles.productInfoList : styles.productInfo}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.productCat}>{item.category}</Text>
                    <Text style={isList ? styles.productNameList : styles.productName} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
                </View>

                {isList && (
                    <View style={styles.verticalDividerList} />
                )}

                <View style={isList ? { alignItems: 'center' } : {}}>
                    <Text style={isList ? styles.productPriceList : styles.productPrice}>{formatCurrency(item.price)}</Text>
                    <View style={styles.stockInfo}>
                        <View style={[styles.stockDot, { backgroundColor: isOutOfStock ? '#EF4444' : '#22C55E' }]} />
                        <Text style={styles.stockText}>Stok: {item.stock ?? '∞'}</Text>
                    </View>
                </View>
            </View>

            {qty > 0 && (
                <View style={isList ? styles.qtyBadgeList : styles.qtyBadge}>
                    <Text style={qtyBadgeTextStyles}>{qty}</Text>
                </View>
            )}
        </Pressable>
    );
});

// Styles khusus untuk didalam memo agar tidak error
const qtyBadgeTextStyles = {
    color: '#FFFFFF',
    fontSize: 14, // Increased font size
    fontWeight: 'bold',
};

const SalesPOS = () => {
    const { width: windowWidth } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { refreshTrigger } = useOrderNotification();
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    // Load viewMode from storage
    useEffect(() => {
        const loadViewMode = async () => {
            try {
                const savedMode = await AsyncStorage.getItem('salesPOS_viewMode');
                if (savedMode) {
                    setViewMode(savedMode);
                }
            } catch (error) {
                console.error('Failed to load view mode', error);
            }
        };
        loadViewMode();
    }, []);

    const toggleViewMode = async () => {
        const newMode = viewMode === 'grid' ? 'list' : 'grid';
        setViewMode(newMode);
        try {
            await AsyncStorage.setItem('salesPOS_viewMode', newMode);
        } catch (error) {
            console.error('Failed to save view mode', error);
        }
    };

    // Cart State
    const [cart, setCart] = useState([]);
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('tunai');
    const [cashPaid, setCashPaid] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastTransaction, setLastTransaction] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [manualDiscount, setManualDiscount] = useState('');

    // Points System State
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [usePoints, setUsePoints] = useState(false);
    const [pointsToUse, setPointsToUse] = useState(0);
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [customerSearchResults, setCustomerSearchResults] = useState([]);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [isCartReady, setIsCartReady] = useState(false);
    const [isCustomerSearchReady, setIsCustomerSearchReady] = useState(false);

    const { confirm } = useConfirm();
    const { ignoreStock, toggleIgnoreStock } = useAppSettings();

    const fetchData = async () => {
        // Hanya tampilkan loading jika data masih kosong (First Load)
        if (menuItems.length === 0) {
            setLoading(true);
        }

        try {
            const [menuRes, catRes] = await Promise.all([
                apiService.get('/api/menu-items/all'),
                apiService.get('/api/categories')
            ]);

            const fetchedMenuItems = menuRes.data.data || [];
            const fetchedCategories = catRes.data.data || [];

            const uniqueCatMap = new Map();

            // 1. Masukkan kategori RESMI dari backend (Prioritas Utama)
            fetchedCategories.forEach(c => {
                if (c.name) {
                    const nameTrimmed = c.name.trim();
                    // Gunakan lowercase sebagai KEY agar "ayam" dan "Ayam" dianggap sama
                    uniqueCatMap.set(nameTrimmed.toLowerCase(), {
                        id: c.id,
                        name: nameTrimmed
                    });
                }
            });

            // 2. Deteksi kategori dari Menu (hanya jika benar-benar belum ada di backend)
            fetchedMenuItems.forEach(item => {
                if (item.category) {
                    const catName = item.category.trim();
                    const normalized = catName.toLowerCase();
                    if (!uniqueCatMap.has(normalized)) {
                        uniqueCatMap.set(normalized, { id: 'temp-' + catName, name: catName });
                    }
                }
            });

            // 3. Urutkan secara alfabet
            const sortedCategories = Array.from(uniqueCatMap.values()).sort((a, b) =>
                a.name.localeCompare(b.name)
            );

            setMenuItems(fetchedMenuItems);
            setCategories(sortedCategories);
            setHasError(false);
        } catch (error) {
            console.error('Error fetching POS data:', error);
            setHasError(true);
            // Hanya tampilkan alert jika ini adalah percobaan pertama dan gagal
            if (menuItems.length === 0) {
                Alert.alert('Gagal Memuat Data', 'Pastikan koneksi internet Anda stabil dan coba lagi.');
            } else {
                // Optional: silent toast instead? but let's be clear for now
                console.log('Update failed silently');
            }
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [refreshTrigger])
    );


    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            // Cocokkan secara case-insensitive agar produk dengan kategori "ayam" muncul saat filter "Ayam" diklik
            const matchesCategory = activeCategory === 'Semua' ||
                (item.category && item.category.trim().toLowerCase() === activeCategory.toLowerCase());
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [menuItems, activeCategory, searchTerm]);

    const addToCart = useCallback((item) => {
        setCart(prevCart => {
            const existing = prevCart.find(i => i.id === item.id);
            if (existing) {
                if (!ignoreStock && existing.quantity >= item.stock && item.stock !== null) {
                    Alert.alert('Stok Habis', 'Jumlah melebihi stok yang tersedia. Aktifkan "Abaikan Stok" jika ingin tetap menjual.');
                    return prevCart;
                }
                return prevCart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            if (!ignoreStock && item.stock <= 0 && item.stock !== null) {
                Alert.alert('Stok Habis', 'Produk ini sedang kosong. Aktifkan "Abaikan Stok" jika ingin tetap menjual.');
                return prevCart;
            }
            return [...prevCart, { ...item, quantity: 1 }];
        });
    }, [ignoreStock]);

    const removeFromCart = useCallback((id) => {
        setCart(prevCart => prevCart.filter(item => item.id !== id));
    }, []);

    const updateQuantity = useCallback((id, delta) => {
        setCart(prevCart => {
            return prevCart.map(item => {
                if (item.id === id) {
                    const newQty = item.quantity + delta;
                    if (newQty <= 0) return null;
                    // Check stock
                    const originalItem = menuItems.find(m => m.id === id);
                    if (!ignoreStock && delta > 0 && originalItem && originalItem.stock !== null && newQty > originalItem.stock) {
                        return item;
                    }
                    return { ...item, quantity: newQty };
                }
                return item;
            }).filter(Boolean);
        });
    }, [menuItems, ignoreStock]);

    const subtotal = useMemo(() => {
        return cart.reduce((acc, curr) => {
            const itemPrice = parseFloat(curr.price || 0);
            const basePrice = curr.basePrice ? parseFloat(curr.basePrice) : null;
            const itemDiscount = parseFloat(curr.discount || 0);
            const quantity = curr.quantity || 0;

            let priceAfterDiscount;
            if (basePrice !== null) {
                // If basePrice exists, it's the original price.
                priceAfterDiscount = itemDiscount > 0
                    ? Math.round(basePrice * (1 - (itemDiscount / 100)))
                    : basePrice;
            } else {
                // Fresh item from menu, apply discount to current price
                priceAfterDiscount = itemDiscount > 0
                    ? Math.round(itemPrice * (1 - (itemDiscount / 100)))
                    : itemPrice;
            }
            return acc + (priceAfterDiscount * quantity);
        }, 0);
    }, [cart]);

    const finalTotal = useMemo(() => {
        const discountVal = parseFloat(manualDiscount || 0);
        const pointsVal = usePoints ? pointsToUse : 0;
        return Math.max(0, subtotal - discountVal - pointsVal);
    }, [subtotal, manualDiscount, usePoints, pointsToUse]);

    const totalItemsCount = useMemo(() => {
        return cart.reduce((acc, curr) => acc + curr.quantity, 0);
    }, [cart]);

    const formatCurrency = useCallback((val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    }, []);

    const handleClearCart = async () => {
        const accepted = await confirm({
            title: 'Kosongkan Keranjang',
            message: 'Apakah Anda yakin ingin menghapus semua menu yang dipilih?',
            confirmText: 'Ya, Hapus Semua',
            type: 'danger'
        });

        if (accepted) {
            setCart([]);
            setIsCartModalOpen(false);
        }
    };

    const handleProcessTransaction = async () => {
        if (cart.length === 0) return;

        const total = finalTotal;
        const paid = paymentMethod === 'tunai' ? parseFloat(cashPaid || 0) : total;

        if (paymentMethod === 'tunai' && paid < total) {
            Alert.alert('Pembayaran Kurang', 'Jumlah bayar tidak mencukupi');
            return;
        }

        if (usePoints && pointsToUse > (selectedCustomer?.points || 0)) {
            Alert.alert('Poin Kurang', 'Jumlah poin yang digunakan melebihi saldo poin pelanggan');
            return;
        }

        setIsProcessing(true);
        try {
            const transactionData = {
                items: cart.map(item => {
                    const itemPrice = parseFloat(item.price) || 0;
                    const itemDiscount = parseFloat(item.discount) || 0;
                    const priceAfterDiscount = itemDiscount > 0
                        ? Math.round(itemPrice * (1 - (itemDiscount / 100)))
                        : itemPrice;

                    return {
                        id: item.id,
                        name: item.name,
                        price: priceAfterDiscount, // Send final price to be consistent with web
                        basePrice: itemPrice,      // Include basePrice for receipt
                        quantity: item.quantity,
                        discount: itemDiscount
                    };
                }),
                subtotal: subtotal,
                manual_discount: parseFloat(manualDiscount || 0),
                total: total,
                ppn: 0,
                cashPaid: paid,
                change: paid - total,
                payment_method: paymentMethod === 'qris' ? 'transfer' : paymentMethod,
                ignoreStock: ignoreStock,
                customer_name: parseInt(selectedCustomer?.id) ? selectedCustomer.name : (customerName || null),
                customer_phone: parseInt(selectedCustomer?.id) ? selectedCustomer.phone : (customerPhone || null),
                customer_address: parseInt(selectedCustomer?.id) ? selectedCustomer.address : (customerAddress || null),
                customerId: selectedCustomer?.id || null,
                pointsUsed: usePoints ? pointsToUse : 0,
                timestamp: new Date()
            };

            const response = await apiService.post('/api/transactions', transactionData);

            // Set transaction data for receipt (use ID from server if available)
            setLastTransaction({
                ...transactionData,
                id: response.data.transactionId || response.data.id || 'TRX-' + Date.now(),
            });

            setCart([]);
            setIsCartModalOpen(false);
            setCashPaid('');
            setManualDiscount('');
            setCustomerName('');
            setCustomerPhone('');
            setCustomerAddress('');
            setSelectedCustomer(null);
            setUsePoints(false);
            setPointsToUse(0);
            setShowReceipt(true);
            fetchData();
        } catch (error) {
            console.error('Transaction Error:', error);
            const errorMessage = error.response?.data?.error || 'Gagal memproses transaksi';
            Alert.alert('Error', errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    // Customer Search Logic
    const searchCustomers = useCallback(async (query = '') => {
        setIsSearchingCustomer(true);
        try {
            let url = '/api/customers?limit=20'; // Default list

            if (query && query.length >= 1) {
                url = `/api/customers/search?query=${query}`;
            }

            const response = await apiService.get(url);
            // Handle different field names (username vs name) from different endpoints if necessary
            // But ideally we handle it in render or standardized backend response.
            // For now, let's pass data.
            setCustomerSearchResults(response.data.data || []);
        } catch (error) {
            console.error("Error searching customers:", error);
        } finally {
            setIsSearchingCustomer(false);
        }
    }, []);

    useEffect(() => {
        if (showCustomerSearch) {
            const timer = setTimeout(() => {
                searchCustomers(customerSearchQuery);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [customerSearchQuery, showCustomerSearch, searchCustomers]);

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerName(customer.name);
        setCustomerPhone(customer.phone);
        setCustomerAddress(customer.address);
        setShowCustomerSearch(false);
        setCustomerSearchQuery('');
        setCustomerSearchResults([]);
    };

    // Calculate max points usable automatically when enabled
    useEffect(() => {
        if (usePoints && selectedCustomer) {
            const pendingTotal = subtotal - parseFloat(manualDiscount || 0);
            // Can use points up to pendingTotal or limited by balance
            // 1 Point = 1 Rupiah redemption value
            const maxUsable = Math.min(pendingTotal, selectedCustomer.points || 0);
            setPointsToUse(Math.floor(maxUsable));
        } else {
            setPointsToUse(0);
        }
    }, [usePoints, selectedCustomer, subtotal, manualDiscount]);

    const quickCashOptions = [5000, 10000, 20000, 50000, 100000];

    const renderMenuItem = useCallback(({ item }) => {
        const itemInCart = cart.find(i => i.id === item.id);
        const qty = itemInCart ? itemInCart.quantity : 0;
        const isOutOfStock = item.stock <= 0 && item.stock !== null;

        return (
            <ProductCardItem
                item={item}
                qty={qty}
                addToCart={addToCart}
                ignoreStock={ignoreStock}
                formatCurrency={formatCurrency}
                isOutOfStock={isOutOfStock}
                viewMode={viewMode}
            />
        );
    }, [cart, addToCart, ignoreStock, formatCurrency, viewMode]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <Text style={styles.title}>Kasir Jual</Text>
                    <View style={styles.headerSwitch}>
                        <PackageX size={18} color={ignoreStock ? "#2563EB" : "#94A3B8"} />
                        <Text style={[styles.switchLabel, ignoreStock && styles.switchLabelActive]}>Abaikan Stok</Text>
                        <Switch
                            value={ignoreStock}
                            onValueChange={toggleIgnoreStock}
                            trackColor={{ false: "#E2E8F0", true: "#BFDBFE" }}
                            thumbColor={ignoreStock ? "#2563EB" : "#94A3B8"}
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                        />
                    </View>
                </View>

                <View style={styles.searchRow}>
                    <View style={styles.searchBar}>
                        <Search size={20} color="#94A3B8" />
                        <TextInput
                            placeholder="Cari menu..."
                            style={styles.searchInput}
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.viewToggleBtn}
                        onPress={toggleViewMode}
                    >
                        {viewMode === 'grid' ? (
                            <List size={24} color="#64748B" />
                        ) : (
                            <LayoutGrid size={24} color="#64748B" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Categories */}
            <View style={styles.catContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                    <TouchableOpacity
                        onPress={() => setActiveCategory('Semua')}
                        style={[styles.catBtn, activeCategory === 'Semua' && styles.activeCatBtn]}
                    >
                        <Text style={[styles.catBtnText, activeCategory === 'Semua' && styles.activeCatBtnText]}>Semua</Text>
                    </TouchableOpacity>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            onPress={() => setActiveCategory(cat.name)}
                            style={[
                                styles.catBtn,
                                activeCategory === cat.name && styles.activeCatBtn
                            ]}
                        >
                            <Text style={[
                                styles.catBtnText,
                                activeCategory === cat.name && styles.activeCatBtnText
                            ]}>
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* List */}
            {loading && menuItems.length === 0 ? (
                <ModernLoader type="grid" />
            ) : (
                <FlatList
                    key={viewMode} // Force re-render when switching modes
                    data={filteredItems}
                    keyExtractor={item => item.id.toString()}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    renderItem={renderMenuItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={fetchData}
                            colors={['#138FEA']}
                            tintColor="#138FEA"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <ShoppingCart size={60} color={hasError ? "#EF4444" : "#E2E8F0"} />
                            <Text style={styles.emptyText}>
                                {hasError ? 'Gagal Memuat Menu' : 'Menu tidak ditemukan'}
                            </Text>
                            {hasError && (
                                <TouchableOpacity
                                    style={{
                                        marginTop: 15,
                                        backgroundColor: '#138FEA',
                                        paddingHorizontal: 20,
                                        paddingVertical: 10,
                                        borderRadius: 10
                                    }}
                                    onPress={() => fetchData()}
                                >
                                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Coba Lagi</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                />
            )}

            {/* Premium Neo-Fintech Floating Cart Bar */}
            {cart.length > 0 && (
                <View style={styles.fabWrapper}>
                    <TouchableOpacity
                        activeOpacity={0.98}
                        style={styles.fabCard}
                        onPress={() => {
                            setIsCartModalOpen(true);
                            InteractionManager.runAfterInteractions(() => {
                                setIsCartReady(true);
                            });
                        }}
                    >
                        {/* Info Section: Left side focuses on value and quantity */}
                        <View style={styles.fabDetailsArea}>
                            <View style={styles.fabBadgeWrapper}>
                                <Text style={styles.fabBadgeText}>{totalItemsCount}</Text>
                            </View>
                            <View style={styles.fabPriceInfo}>
                                <Text style={styles.fabPriceLabel}>Total Bayar</Text>
                                <Text style={styles.fabPriceValue}>{formatCurrency(subtotal)}</Text>
                            </View>
                        </View>

                        {/* Quick Action Area: Right side is the primary touch target */}
                        <View style={styles.fabActionArea}>
                            <TouchableOpacity
                                onPress={handleClearCart}
                                style={styles.fabClearBtn}
                            >
                                <Trash2 size={16} color="#EF4444" />
                            </TouchableOpacity>

                            <View style={styles.fabVerticalDivider} />

                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.payButtonPill}
                                onPress={() => {
                                    setIsCartModalOpen(true);
                                    InteractionManager.runAfterInteractions(() => {
                                        setIsCartReady(true);
                                    });
                                }}
                            >
                                <Text style={styles.payButtonText}>BAYAR</Text>
                                <View style={styles.payButtonIconWrap}>
                                    <ArrowRight size={14} color="#FFFFFF" strokeWidth={3} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </View>
            )}

            {/* Cart Modal */}
            <Modal
                visible={isCartModalOpen}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setIsCartModalOpen(false)}
            >
                <View style={styles.modalContent}>
                    <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                    <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top + 15, 35) }]}>
                        <View>
                            <Text style={styles.modalTitle}>Detail Pesanan</Text>
                            <Text style={styles.modalSubtitle}>{totalItemsCount} ITEM TERPILIH</Text>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => {
                                    setIsCartModalOpen(false);
                                    setIsCartReady(false);
                                }}
                            >
                                <X size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                    >
                        <View style={styles.modalScrollContainer}>
                            {!isCartReady ? (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color="#138FEA" />
                                </View>
                            ) : (
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.modalBodyContent}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    <View style={styles.cartList}>
                                        {cart.map(item => (
                                            <View key={item.id} style={styles.cartItem}>
                                                <View style={styles.cartItemLeft}>
                                                    <Text style={styles.cartItemName} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
                                                    <Text style={styles.cartItemPrice}>{formatCurrency(item.price)}</Text>
                                                </View>
                                                <View style={styles.cartItemRight}>
                                                    <View style={styles.qtyControl}>
                                                        <TouchableOpacity
                                                            style={styles.qtyBtn}
                                                            onPress={() => updateQuantity(item.id, -1)}
                                                        >
                                                            <Minus size={16} color="#64748B" />
                                                        </TouchableOpacity>
                                                        <Text style={styles.qtyText}>{item.quantity}</Text>
                                                        <TouchableOpacity
                                                            style={styles.qtyBtn}
                                                            onPress={() => updateQuantity(item.id, 1)}
                                                        >
                                                            <Plus size={16} color="#64748B" />
                                                        </TouchableOpacity>
                                                    </View>
                                                    <TouchableOpacity
                                                        style={styles.trashBtn}
                                                        onPress={() => removeFromCart(item.id)}
                                                    >
                                                        <Trash2 size={18} color="#EF4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.paymentSection}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <Text style={styles.sectionLabel}>DATA PELANGGAN</Text>
                                            {!selectedCustomer && (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setShowCustomerSearch(true);
                                                        InteractionManager.runAfterInteractions(() => {
                                                            setIsCustomerSearchReady(true);
                                                        });
                                                    }}
                                                    style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                                                >
                                                    <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 12 }}>+ Cari Member</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        {selectedCustomer ? (
                                            <View style={styles.selectedCustomerCard}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <View>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                            <Text style={styles.customerName}>{selectedCustomer.name}</Text>
                                                            <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                                <Text style={{ color: '#166534', fontSize: 10, fontWeight: 'bold' }}>MEMBER</Text>
                                                            </View>
                                                        </View>
                                                        <Text style={styles.customerPhone}>{selectedCustomer.phone || '-'}</Text>
                                                        <Text style={styles.customerPoints}>Poin: {formatCurrency(selectedCustomer.points)}</Text>
                                                    </View>
                                                    <TouchableOpacity onPress={() => {
                                                        setSelectedCustomer(null);
                                                        setUsePoints(false);
                                                        setCustomerName('');
                                                        setCustomerPhone('');
                                                        setCustomerAddress('');
                                                    }}>
                                                        <X size={16} color="#94A3B8" />
                                                    </TouchableOpacity>
                                                </View>

                                                {/* Points Redemption Toggle */}
                                                {(selectedCustomer.points > 0) && (
                                                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <View>
                                                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1E293B' }}>Gunakan Poin</Text>
                                                                <Text style={{ fontSize: 11, color: '#64748B' }}>Tukar {pointsToUse} poin</Text>
                                                            </View>
                                                            <Switch
                                                                value={usePoints}
                                                                onValueChange={setUsePoints}
                                                                trackColor={{ false: "#E2E8F0", true: "#BFDBFE" }}
                                                                thumbColor={usePoints ? "#2563EB" : "#F1F5F9"}
                                                            />
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        ) : (
                                            <View style={styles.customerInputContainer}>
                                                <TextInput
                                                    style={styles.customerInput}
                                                    placeholder="Nama Pelanggan"
                                                    value={customerName}
                                                    onChangeText={setCustomerName}
                                                    placeholderTextColor="#94A3B8"
                                                />
                                                <TextInput
                                                    style={styles.customerInput}
                                                    placeholder="Nomor HP / WhatsApp"
                                                    value={customerPhone}
                                                    onChangeText={setCustomerPhone}
                                                    keyboardType="phone-pad"
                                                    placeholderTextColor="#94A3B8"
                                                />
                                                <TextInput
                                                    style={[styles.customerInput, { height: 60, textAlignVertical: 'top', paddingTop: 10 }]}
                                                    placeholder="Alamat Pelanggan"
                                                    value={customerAddress}
                                                    onChangeText={setCustomerAddress}
                                                    multiline
                                                    placeholderTextColor="#94A3B8"
                                                />
                                            </View>
                                        )}

                                        <Text style={styles.sectionLabel}>DISKON MANUAL</Text>
                                        <View style={[styles.cashInputWrapper, { paddingHorizontal: 0, marginBottom: 20, height: 50, minHeight: 'auto' }]}>
                                            <View style={styles.manualDiscountIconArea}>
                                                <Text style={styles.discountIconText}>%</Text>
                                            </View>
                                            <TextInput
                                                style={[styles.cashInput, { paddingLeft: 12 }]}
                                                placeholder="0"
                                                keyboardType="numeric"
                                                value={manualDiscount}
                                                onChangeText={setManualDiscount}
                                            />
                                        </View>

                                        <Text style={styles.sectionLabel}>METODE PEMBAYARAN</Text>
                                        <View style={styles.methodGrid}>
                                            <TouchableOpacity
                                                style={[styles.methodBtn, paymentMethod === 'tunai' && styles.activeMethod]}
                                                onPress={() => setPaymentMethod('tunai')}
                                            >
                                                <Banknote size={24} color={paymentMethod === 'tunai' ? '#2563EB' : '#64748B'} />
                                                <Text style={[styles.methodText, paymentMethod === 'tunai' && styles.activeMethodText]}>Tunai</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.methodBtn, paymentMethod === 'qris' && styles.activeMethod]}
                                                onPress={() => setPaymentMethod('qris')}
                                            >
                                                <QrCode size={24} color={paymentMethod === 'qris' ? '#2563EB' : '#64748B'} />
                                                <Text style={[styles.methodText, paymentMethod === 'qris' && styles.activeMethodText]}>QRIS</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {paymentMethod === 'tunai' && (
                                            <View style={styles.cashInputArea}>
                                                <Text style={styles.sectionLabel}>UANG DIBAYAR</Text>
                                                <View style={styles.cashInputWrapper}>
                                                    <Text style={styles.rpPrefix}>Rp</Text>
                                                    <TextInput
                                                        style={styles.cashInput}
                                                        placeholder="0"
                                                        keyboardType="numeric"
                                                        value={cashPaid}
                                                        onChangeText={setCashPaid}
                                                    />
                                                </View>

                                                <View style={styles.quickCashRow}>
                                                    {quickCashOptions.map(amount => (
                                                        <TouchableOpacity
                                                            key={amount}
                                                            onPress={() => setCashPaid(amount.toString())}
                                                            style={styles.quickCashBtn}
                                                        >
                                                            <Text style={styles.quickCashText}>{amount / 1000}k</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                    <TouchableOpacity
                                                        onPress={() => setCashPaid(finalTotal.toString())}
                                                        style={[styles.quickCashBtn, { backgroundColor: '#EFF6FF', borderColor: '#2563EB' }]}
                                                    >
                                                        <Text style={[styles.quickCashText, { color: '#2563EB' }]}>Pas</Text>
                                                    </TouchableOpacity>
                                                </View>

                                                {parseFloat(cashPaid || 0) >= finalTotal && parseFloat(cashPaid || 0) > 0 && (
                                                    <View style={styles.changeInfo}>
                                                        <Text style={styles.changeLabel}>Kembalian</Text>
                                                        <Text style={styles.changeValue}>{formatCurrency(parseFloat(cashPaid) - finalTotal)}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                </ScrollView>
                            )}
                        </View>
                    </KeyboardAvoidingView>

                    {/* Modal Footer */}
                    <View style={[styles.modalFooter, { paddingBottom: getSafeBottomPadding(insets) }]}>
                        <View style={{ gap: 4, marginBottom: 12 }}>
                            {parseFloat(manualDiscount || 0) > 0 && (
                                <View style={styles.totalRow}>
                                    <Text style={{ color: '#64748B', fontSize: 14, fontWeight: 'bold' }}>Subtotal</Text>
                                    <Text style={{ color: '#64748B', fontSize: 14, fontWeight: 'bold' }}>{formatCurrency(subtotal)}</Text>
                                </View>
                            )}
                            {parseFloat(manualDiscount || 0) > 0 && (
                                <View style={styles.totalRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <View style={{ backgroundColor: '#FEF2F2', padding: 4, borderRadius: 6 }}>
                                            <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: 'bold' }}>DISKON</Text>
                                        </View>
                                    </View>
                                    <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: 'bold' }}>-{formatCurrency(parseFloat(manualDiscount))}</Text>
                                </View>
                            )}
                            {usePoints && pointsToUse > 0 && (
                                <View style={styles.totalRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <View style={{ backgroundColor: '#EFF6FF', padding: 4, borderRadius: 6 }}>
                                            <Text style={{ color: '#2563EB', fontSize: 10, fontWeight: 'bold' }}>POIN</Text>
                                        </View>
                                    </View>
                                    <Text style={{ color: '#2563EB', fontSize: 14, fontWeight: 'bold' }}>-{formatCurrency(pointsToUse)}</Text>
                                </View>
                            )}
                        </View>

                        <View style={[styles.totalRow, { marginBottom: 20 }]}>
                            <View>
                                <Text style={styles.totalLabel}>TOTAL TAGIHAN</Text>
                                <Text style={styles.totalValue}>{formatCurrency(finalTotal)}</Text>
                            </View>
                            <View style={styles.paymentMethodBadge}>
                                <Text style={styles.paymentMethodBadgeText}>{paymentMethod.toUpperCase()}</Text>
                            </View>
                        </View>

                        {(() => {
                            const isDisabled = isProcessing || (paymentMethod === 'tunai' && parseFloat(cashPaid || 0) < finalTotal);
                            return (
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={styles.payBtnTouchable}
                                    disabled={isDisabled}
                                    onPress={handleProcessTransaction}
                                >
                                    <View
                                        style={[
                                            styles.payBtn,
                                            { backgroundColor: isDisabled ? '#94A3B8' : '#2563EB' }
                                        ]}
                                    >
                                        {isProcessing ? (
                                            <ActivityIndicator color="#FFFFFF" size="small" />
                                        ) : (
                                            <>
                                                <Text style={styles.payBtnText}>KONFIRMASI PEMBAYARAN</Text>
                                                <ArrowRight size={20} color="#FFFFFF" strokeWidth={3} />
                                            </>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })()}
                    </View>
                </View>
            </Modal>

            {/* Receipt Modal */}
            {showReceipt && (
                <ReceiptModal
                    visible={showReceipt}
                    onClose={() => setShowReceipt(false)}
                    transaction={lastTransaction}
                />
            )}

            {/* Customer Search Modal */}
            <Modal
                visible={showCustomerSearch}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowCustomerSearch(false)}
            >
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={styles.customerSearchContainer}>
                    <View style={[styles.customerSearchHeader, { paddingTop: Math.max(insets.top + 15, 35) }]}>
                        <Text style={styles.customerSearchTitle}>Cari Pelanggan</Text>
                        <TouchableOpacity onPress={() => {
                            setShowCustomerSearch(false);
                            setIsCustomerSearchReady(false);
                        }}>
                            <X size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.customerSearchBar}>
                        <Search size={20} color="#94A3B8" />
                        <TextInput
                            style={styles.customerSearchInput}
                            placeholder="Nama atau No. HP"
                            value={customerSearchQuery}
                            onChangeText={(text) => {
                                setCustomerSearchQuery(text);
                            }}
                            autoFocus
                        />
                    </View>

                    {!isCustomerSearchReady ? (
                        <ActivityIndicator style={{ marginTop: 40 }} color="#2563EB" />
                    ) : (
                        <FlatList
                            data={customerSearchResults}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.customerSearchResultItem}
                                    onPress={() => handleSelectCustomer(item)}
                                >
                                    <View>
                                        <Text style={styles.resultName} numberOfLines={1} ellipsizeMode="tail">{item.name || item.username}</Text>
                                        <Text style={styles.resultPhone}>{item.phone}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.resultPoints}>{formatCurrency(item.points)}</Text>
                                        <Text style={{ fontSize: 10, color: '#94A3B8' }}>Poin</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={() => (
                                isSearchingCustomer ? (
                                    <ActivityIndicator style={{ marginTop: 20 }} color="#2563EB" />
                                ) : (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text style={{ color: '#94A3B8' }}>Tidak ada hasil</Text>
                                    </View>
                                )
                            )}
                        />
                    )}
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : (Platform.OS === 'web' ? 15 : 20),
        paddingHorizontal: '5%',
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        minHeight: 140,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 15,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 16,
        height: 50,
        borderRadius: 15,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    catContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
    },
    catScroll: {
        paddingHorizontal: '5%',
        gap: 10,
    },
    catBtn: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    activeCatBtn: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    catBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#64748B',
    },
    activeCatBtnText: {
        color: '#FFFFFF',
    },
    listContent: {
        padding: '3%',
        paddingBottom: 100,
    },
    // List View Styles
    productCardList: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        marginBottom: 12,
        borderRadius: 20, // Slightly more rounded
        padding: 12, // Increased padding for breathability
        borderWidth: 1,
        borderColor: '#E2E8F0', // Softer border color
        flexDirection: 'row',
        alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0px 4px 6px -1px rgba(0,0,0,0.05), 0px 2px 4px -1px rgba(0,0,0,0.03)' }, // Modern soft shadow
            android: { elevation: 2 }
        })
    },
    imageWrapperList: {
        width: '22%',
        aspectRatio: 1,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#F1F5F9',
        marginRight: 16,
        position: 'relative',
        borderWidth: 1,
        borderColor: '#F8FAFC',
    },
    productInfoList: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    verticalDividerList: {
        width: 2,
        alignSelf: 'stretch',
        backgroundColor: '#CBD5E1',
        marginHorizontal: 8,
    },
    productNameList: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    productPriceList: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 4,
    },
    discountBadgeList: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#EF4444',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderBottomRightRadius: 8,
    },
    qtyBadgeList: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#2563EB',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        zIndex: 10,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    viewToggleBtn: {
        width: 50,
        height: 50,
        backgroundColor: '#F1F5F9',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // End List Styles

    productCard: {
        backgroundColor: '#FFFFFF',
        flex: 1,
        maxWidth: '48%',
        marginHorizontal: '1%',
        marginVertical: 6,
        borderRadius: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' },
            android: { elevation: 3 }
        })
    },
    selectedProductCard: {
        borderColor: '#2563EB',
        borderWidth: 2,
        backgroundColor: '#F8FAFC',
        transform: [{ scale: 0.98 }]
    },
    outOfStockCard: {
        opacity: 0.6,
        backgroundColor: '#F1F5F9'
    },
    imageWrapper: {
        width: '100%',
        aspectRatio: 1.2,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
        position: 'relative',
        marginBottom: 8,
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderImg: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: '#2563EB',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        zIndex: 10,
    },
    qtyBadgeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    discountBadge: {
        position: 'absolute',
        bottom: 6,
        left: 6,
        backgroundColor: '#EF4444',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
    },
    productInfo: {
        padding: 2,
    },
    productCat: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#2563EB',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 8,
        overflow: 'hidden',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    productName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
        lineHeight: 20,
        marginBottom: 2,
        flexWrap: 'wrap',
        flexShrink: 1,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 4,
    },
    stockInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stockDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    stockText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
    fabWrapper: {
        position: 'absolute',
        bottom: 25,
        left: '5%',
        right: '5%',
        zIndex: 1000,
    },
    fabCard: {
        backgroundColor: '#FFFFFF',
        minHeight: 72,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 16,
        paddingRight: 8,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            ios: {
                shadowColor: '#6366F1',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
            },
            android: { elevation: 15 },
            web: { boxShadow: '0px 10px 40px rgba(99, 102, 241, 0.12)' }
        }),
    },
    fabDetailsArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    fabBadgeWrapper: {
        width: 32,
        height: 32,
        backgroundColor: '#EEF2FF',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    fabBadgeText: {
        color: '#4F46E5',
        fontSize: 14,
        fontWeight: '900',
    },
    fabPriceInfo: {
        justifyContent: 'center',
    },
    fabPriceLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    fabPriceValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    fabActionArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fabClearBtn: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fabVerticalDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 4,
    },
    payButtonPill: {
        backgroundColor: '#2563EB',
        minHeight: 56,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#2563EB',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
            },
            android: { elevation: 4 },
        }),
    },
    payButtonText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 1,
    },
    payButtonIconWrap: {
        width: 22,
        height: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#94A3B8',
        marginTop: 15,
    },

    // Modal Styles
    modalContent: {
        backgroundColor: '#FFFFFF',
        flex: 1,
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        zIndex: 100,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
    },
    modalSubtitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 2,
    },
    closeBtn: {
        padding: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalBody: {
        flex: 1,
    },
    modalScrollContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    modalBodyContent: {
        padding: 24,
        paddingBottom: 40,
        flexGrow: 1,
    },
    cartList: {
        marginBottom: 30,
    },
    cartItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
    },
    cartItemLeft: {
        flex: 1,
    },
    cartItemName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    cartItemPrice: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#2563EB',
        marginTop: 2,
    },
    cartItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    qtyBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyText: {
        width: 30,
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#1E293B',
    },
    trashBtn: {
        padding: 8,
    },
    headerSwitch: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    switchLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#94A3B8',
        marginHorizontal: 6,
    },
    switchLabelActive: {
        color: '#2563EB',
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    methodGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 25,
    },
    methodBtn: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingVertical: 10,
        minHeight: 48,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 10,
    },
    activeMethod: {
        backgroundColor: '#EFF6FF',
        borderColor: '#2563EB',
    },
    methodText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
    },
    activeMethodText: {
        color: '#2563EB',
    },
    cashInputArea: {
        marginBottom: 20,
    },
    cashInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 15,
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    rpPrefix: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
        marginRight: 5,
    },
    cashInput: {
        flex: 1,
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
    },
    quickCashRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    quickCashBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    quickCashText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
    },
    changeInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        backgroundColor: '#F0FDF4',
        padding: 15,
        borderRadius: 15,
    },
    changeLabel: {
        color: '#166534',
        fontWeight: 'bold',
    },
    changeValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#166534',
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -10 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: {
                elevation: 20,
                borderTopWidth: 0,
            },
            web: {
                boxShadow: '0px -15px 30px rgba(0,0,0,0.08)',
                borderTopWidth: 0,
            }
        })
    },
    manualDiscountIconArea: {
        backgroundColor: '#EF4444',
        width: 50,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 14,
        borderBottomLeftRadius: 14,
    },
    discountIconText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    totalLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 2,
    },
    totalValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1E293B',
    },
    paymentMethodBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    paymentMethodBadgeText: {
        color: '#2563EB',
        fontSize: 10,
        fontWeight: '900',
    },
    payBtn: {
        minHeight: 60,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 16,
        paddingHorizontal: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#1E40AF',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
            },
            android: { elevation: 8 }
        })
    },
    payBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    disabledBtn: {
        opacity: 0.5,
    },
    // Customer Input Styles
    customerInputContainer: {
        marginBottom: 20,
        gap: 10,
    },
    customerInput: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        minHeight: 44,
    },
    customerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    customerPhone: {
        fontSize: 14,
        color: '#64748B',
    },
    customerPoints: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2563EB',
        marginTop: 2,
    },
    customerSearchContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
    },
    customerSearchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        minHeight: 40,
    },
    customerSearchTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    customerSearchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 12,
        marginBottom: 15,
    },
    customerSearchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#1E293B',
    },
    customerSearchResultItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        minHeight: 60,
    },
    resultName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    resultPhone: {
        fontSize: 13,
        color: '#64748B',
    },
    resultPoints: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    selectedCustomerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
    }
});

export default SalesPOS;
