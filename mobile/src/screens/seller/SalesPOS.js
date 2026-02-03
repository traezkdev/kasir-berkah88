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
    Dimensions,
    Platform,
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    RefreshControl
} from 'react-native';
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
    CreditCard,
    Banknote,
    Smartphone
} from 'lucide-react-native';
import apiService, { API_URL } from '../../api/apiService';

const { width, height } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

const SalesPOS = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Semua');

    // Cart State
    const [cart, setCart] = useState([]);
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('tunai');
    const [cashPaid, setCashPaid] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [menuRes, catRes] = await Promise.all([
                apiService.get('/api/menu-items/all'),
                apiService.get('/api/categories')
            ]);
            setMenuItems(menuRes.data.data || []);
            setCategories(catRes.data.data || []);
        } catch (error) {
            console.error('Error fetching POS data:', error);
            Alert.alert('Error', 'Gagal memuat data menu');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [menuItems, activeCategory, searchTerm]);

    const addToCart = (item) => {
        setCart(prevCart => {
            const existing = prevCart.find(i => i.id === item.id);
            if (existing) {
                if (existing.quantity >= item.stock && item.stock !== null) {
                    Alert.alert('Stok Habis', 'Jumlah melebihi stok yang tersedia');
                    return prevCart;
                }
                return prevCart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            if (item.stock <= 0 && item.stock !== null) {
                Alert.alert('Stok Habis', 'Produk ini sedang kosong');
                return prevCart;
            }
            return [...prevCart, { ...item, quantity: 1 }];
        });
    };

    const updateQuantity = (id, delta) => {
        setCart(prevCart => {
            return prevCart.map(item => {
                if (item.id === id) {
                    const newQty = item.quantity + delta;
                    if (newQty <= 0) return null;
                    // Check stock
                    const originalItem = menuItems.find(m => m.id === id);
                    if (delta > 0 && originalItem && originalItem.stock !== null && newQty > originalItem.stock) {
                        return item;
                    }
                    return { ...item, quantity: newQty };
                }
                return item;
            }).filter(Boolean);
        });
    };

    const removeFromCart = (id) => {
        setCart(prevCart => prevCart.filter(item => item.id !== id));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val || 0);
    };

    const handleProcessTransaction = async () => {
        if (cart.length === 0) return;

        const total = subtotal; // Assume no PPN for now or add later
        const paid = paymentMethod === 'tunai' ? parseFloat(cashPaid || 0) : total;

        if (paymentMethod === 'tunai' && paid < total) {
            Alert.alert('Pembayaran Kurang', 'Jumlah bayar tidak mencukupi');
            return;
        }

        setIsProcessing(true);
        try {
            const transactionData = {
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    discount: item.discount || 0
                })),
                total: total,
                ppn: 0,
                cashPaid: paid,
                change: paid - total,
                payment_method: paymentMethod
            };

            await apiService.post('/api/transactions', transactionData);
            Alert.alert('Sukses', 'Transaksi berhasil diproses');
            setCart([]);
            setIsCartModalOpen(false);
            setCashPaid('');
            fetchData();
        } catch (error) {
            console.error('Transaction Error:', error);
            Alert.alert('Error', 'Gagal memproses transaksi');
        } finally {
            setIsProcessing(false);
        }
    };

    const quickCashOptions = [5000, 10000, 20000, 50000, 100000];

    const renderMenuItem = ({ item }) => {
        const itemInCart = cart.find(i => i.id === item.id);
        const qty = itemInCart ? itemInCart.quantity : 0;
        const isOutOfStock = item.stock <= 0 && item.stock !== null;

        return (
            <TouchableOpacity
                style={[styles.productCard, isOutOfStock && styles.outOfStockCard]}
                onPress={() => !isOutOfStock && addToCart(item)}
                disabled={isOutOfStock}
            >
                <View style={styles.imageWrapper}>
                    {item.image_url ? (
                        <Image
                            source={{ uri: `${API_URL}${item.image_url}` }}
                            style={styles.productImage}
                        />
                    ) : (
                        <View style={styles.placeholderImg}>
                            <ShoppingCart size={30} color="#CBD5E1" />
                        </View>
                    )}
                    {qty > 0 && (
                        <View style={styles.qtyBadge}>
                            <Text style={styles.qtyBadgeText}>{qty}</Text>
                        </View>
                    )}
                    {item.discount > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{Math.round(item.discount)}%</Text>
                        </View>
                    )}
                </View>
                <View style={styles.productInfo}>
                    <Text style={styles.productCat}>{item.category}</Text>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
                    <View style={styles.stockInfo}>
                        <View style={[styles.stockDot, { backgroundColor: isOutOfStock ? '#EF4444' : '#22C55E' }]} />
                        <Text style={styles.stockText}>Stok: {item.stock ?? '∞'}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Kasir Jual</Text>
                <View style={styles.searchBar}>
                    <Search size={20} color="#94A3B8" />
                    <TextInput
                        placeholder="Cari menu..."
                        style={styles.searchInput}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
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
                            style={[styles.catBtn, activeCategory === cat.name && styles.activeCatBtn]}
                        >
                            <Text style={[styles.catBtnText, activeCategory === cat.name && styles.activeCatBtnText]}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#138FEA" />
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    keyExtractor={item => item.id.toString()}
                    numColumns={2}
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
                            <ShoppingCart size={60} color="#E2E8F0" />
                            <Text style={styles.emptyText}>Menu tidak ditemukan</Text>
                        </View>
                    }
                />
            )}

            {/* Floating Cart Button */}
            {cart.length > 0 && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setIsCartModalOpen(true)}
                >
                    <View style={styles.fabInfo}>
                        <View style={styles.fabCount}>
                            <Text style={styles.fabCountText}>{totalItemsCount}</Text>
                        </View>
                        <View>
                            <Text style={styles.fabTotalLabel}>Total Belanja</Text>
                            <Text style={styles.fabTotalValue}>{formatCurrency(subtotal)}</Text>
                        </View>
                    </View>
                    <View style={styles.fabAction}>
                        <Text style={styles.fabActionText}>BAYAR</Text>
                        <ChevronDown size={20} color="#FFFFFF" style={{ transform: [{ rotate: '-90deg' }] }} />
                    </View>
                </TouchableOpacity>
            )}

            {/* Cart Modal */}
            <Modal
                visible={isCartModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsCartModalOpen(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Detail Pesanan</Text>
                                <Text style={styles.modalSubtitle}>{totalItemsCount} ITEM TERPILIH</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsCartModalOpen(false)} style={styles.closeBtn}>
                                <X size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.cartList}>
                                {cart.map(item => (
                                    <View key={item.id} style={styles.cartItem}>
                                        <View style={styles.cartItemLeft}>
                                            <Text style={styles.cartItemName}>{item.name}</Text>
                                            <Text style={styles.cartItemPrice}>{formatCurrency(item.price)}</Text>
                                        </View>
                                        <View style={styles.cartItemRight}>
                                            <View style={styles.qtyControl}>
                                                <TouchableOpacity
                                                    onPress={() => updateQuantity(item.id, -1)}
                                                    style={styles.qtyBtn}
                                                >
                                                    <Minus size={16} color="#64748B" />
                                                </TouchableOpacity>
                                                <Text style={styles.qtyText}>{item.quantity}</Text>
                                                <TouchableOpacity
                                                    onPress={() => updateQuantity(item.id, 1)}
                                                    style={styles.qtyBtn}
                                                >
                                                    <Plus size={16} color="#64748B" />
                                                </TouchableOpacity>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => removeFromCart(item.id)}
                                                style={styles.trashBtn}
                                            >
                                                <Trash2 size={18} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.paymentSection}>
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
                                        style={[styles.methodBtn, paymentMethod === 'transfer' && styles.activeMethod]}
                                        onPress={() => setPaymentMethod('transfer')}
                                    >
                                        <CreditCard size={24} color={paymentMethod === 'transfer' ? '#2563EB' : '#64748B'} />
                                        <Text style={[styles.methodText, paymentMethod === 'transfer' && styles.activeMethodText]}>Transfer</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.methodBtn, paymentMethod === 'gojek' && styles.activeMethod]}
                                        onPress={() => setPaymentMethod('gojek')}
                                    >
                                        <Smartphone size={24} color={paymentMethod === 'gojek' ? '#2563EB' : '#64748B'} />
                                        <Text style={[styles.methodText, paymentMethod === 'gojek' && styles.activeMethodText]}>E-Wallet</Text>
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
                                                autoFocus
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
                                                onPress={() => setCashPaid(subtotal.toString())}
                                                style={[styles.quickCashBtn, { backgroundColor: '#EFF6FF', borderColor: '#2563EB' }]}
                                            >
                                                <Text style={[styles.quickCashText, { color: '#2563EB' }]}>Pas</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {parseFloat(cashPaid || 0) >= subtotal && (
                                            <View style={styles.changeInfo}>
                                                <Text style={styles.changeLabel}>Kembalian</Text>
                                                <Text style={styles.changeValue}>{formatCurrency(parseFloat(cashPaid) - subtotal)}</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total Tagihan</Text>
                                <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.payBtn, (isProcessing || (paymentMethod === 'tunai' && parseFloat(cashPaid || 0) < subtotal)) && styles.disabledBtn]}
                                disabled={isProcessing || (paymentMethod === 'tunai' && parseFloat(cashPaid || 0) < subtotal)}
                                onPress={handleProcessTransaction}
                            >
                                <Text style={styles.payBtnText}>
                                    {isProcessing ? 'Memproses...' : 'KONFIRMASI PEMBAYARAN'}
                                </Text>
                                {!isProcessing && <Check size={20} color="#FFFFFF" />}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
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
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 15,
    },
    searchBar: {
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
        paddingHorizontal: 20,
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
        padding: 15,
        paddingBottom: 100,
    },
    productCard: {
        backgroundColor: '#FFFFFF',
        width: COLUMN_WIDTH,
        margin: 7,
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' },
            android: { elevation: 2 }
        })
    },
    outOfStockCard: {
        opacity: 0.6,
    },
    imageWrapper: {
        width: '100%',
        height: 110,
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImg: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: '#2563EB',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    qtyBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    discountBadge: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        backgroundColor: '#EF4444',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderTopRightRadius: 10,
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
    },
    productInfo: {
        marginTop: 10,
    },
    productCat: {
        fontSize: 9,
        fontWeight: '900',
        color: '#2563EB',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    productName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
        marginTop: 2,
        height: 36,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
        marginTop: 4,
    },
    stockInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    stockDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    stockText: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#1E293B',
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        padding: 8,
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    fabInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    fabCount: {
        width: 36,
        height: 36,
        backgroundColor: '#2563EB',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    fabCountText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 14,
    },
    fabTotalLabel: {
        color: '#94A3B8',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    fabTotalValue: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },
    fabAction: {
        backgroundColor: '#138FEA',
        height: '100%',
        paddingHorizontal: 20,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    fabActionText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 13,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
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
    modalBody: {
        flex: 1,
        padding: 24,
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
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    activeMethod: {
        backgroundColor: '#EFF6FF',
        borderColor: '#2563EB',
    },
    methodText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748B',
        marginTop: 8,
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
        height: 56,
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
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: 'bold',
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
    },
    payBtn: {
        backgroundColor: '#1E40AF',
        height: 60,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    payBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },
    disabledBtn: {
        backgroundColor: '#CBD5E1',
    }
});

export default SalesPOS;
