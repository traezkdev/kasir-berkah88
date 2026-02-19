import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    Platform,
    StatusBar,
    FlatList,
    Modal,
    Animated,
    PanResponder
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSafeBottomPadding } from '../../utils/safeArea';
import {
    Search,
    ArrowLeft,
    Star,
    Plus,
    Minus,
    Zap,
    Image as ImageIcon,
    Clock,
    ChevronDown,
    ShoppingBag,
    XCircle,
    MessageSquare,
    CheckCircle2,
    Utensils,
    Fish,
    Coffee,
    Tag,
    MoreHorizontal,
    Drumstick,
    CupSoda,
    Soup,
    Cookie,
    LayoutGrid
} from 'lucide-react-native';
import apiService, { API_URL } from '../../api/apiService';
import { useCart } from '../../context/CartContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useOrderNotification } from '../../context/OrderNotificationContext';
import useSwipeToClose from '../../hooks/useSwipeToClose';
import usePopups from '../../hooks/usePopups';
import PopupModal from '../../components/PopupModal';
import AppImage from '../../components/AppImage';

const { width, height } = Dimensions.get('window');

// Memoized Menu Card Item for maximum performance
const MenuCardItem = React.memo(({ item, qty, isOpen, ignoreStock, onOpenDetail, formatCurrency }) => {
    const priceAfterDiscount = item.discount > 0 ? Math.round(item.price * (1 - item.discount / 100)) : item.price;
    const isOutOfStock = !ignoreStock && item.stock <= 0;

    return (
        <TouchableOpacity
            style={[styles.menuRow, (!isOpen || isOutOfStock) && styles.menuRowClosed]}
            activeOpacity={0.7}
            onPress={() => isOpen && !isOutOfStock && onOpenDetail(item)}
        >
            <View style={styles.menuImageContainer}>
                <AppImage
                    uri={item.image_url}
                    style={styles.menuImage}
                    placeholderIcon={ImageIcon}
                />
                {item.discount > 0 && (
                    <View style={styles.rowDiscountBadge}>
                        <Text style={styles.rowDiscountText}>{parseFloat(item.discount).toFixed(0)}% OFF</Text>
                    </View>
                )}
                {isOutOfStock && (
                    <View style={styles.outOfStockBadge}>
                        <Text style={styles.outOfStockText}>HABIS</Text>
                    </View>
                )}
            </View>

            <View style={styles.menuInfoContainer}>
                <View>
                    <View style={styles.rowNameHeader}>
                        <Text style={[styles.rowName, isOutOfStock && styles.textMuted]} numberOfLines={1}>{item.name}</Text>
                        {item.average_rating > 0 && (
                            <View style={styles.rowRating}>
                                <Star size={10} color="#FBBF24" fill="#FBBF24" />
                                <Text style={styles.rowRatingText}>{parseFloat(item.average_rating).toFixed(1)}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.rowDesc} numberOfLines={2}>{item.description || 'Tidak ada deskripsi'}</Text>
                </View>

                <View style={styles.rowFooter}>
                    <View>
                        {item.discount > 0 && <Text style={styles.rowOldPrice}>{formatCurrency(item.price)}</Text>}
                        <Text style={styles.rowPrice}>{formatCurrency(priceAfterDiscount)}</Text>
                    </View>

                    {qty > 0 ? (
                        <View style={styles.rowQtyBadge}>
                            <Text style={styles.rowQtyText}>{qty}x</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            disabled={!isOpen || isOutOfStock}
                            style={[
                                styles.rowAddBtn,
                                (!isOpen || isOutOfStock) && styles.rowAddBtnDisabled
                            ]}
                            onPress={() => onOpenDetail(item)}
                        >
                            <Text style={[styles.rowAddText, isOutOfStock && styles.textMuted]}>
                                {isOutOfStock ? 'Habis' : 'Tambah'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}, (prev, next) => {
    return prev.qty === next.qty &&
        prev.isOpen === next.isOpen &&
        prev.ignoreStock === next.ignoreStock &&
        prev.item.id === next.item.id &&
        prev.item.stock === next.item.stock &&
        prev.item.price === next.item.price &&
        prev.item.discount === next.item.discount;
});

const ReviewItem = React.memo(({ rv }) => (
    <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
            <View style={styles.reviewUserWrap}>
                <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>{rv.username?.substring(0, 1).toUpperCase()}</Text>
                </View>
                <View>
                    <Text style={styles.reviewUser}>{rv.username}</Text>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={10} color={s <= rv.rating ? "#FBBF24" : "#E2E8F0"} fill={s <= rv.rating ? "#FBBF24" : "#E2E8F0"} />
                        ))}
                    </View>
                </View>
            </View>
            <Text style={styles.reviewDate}>{new Date(rv.created_at).toLocaleDateString()}</Text>
        </View>
        {rv.comment && <Text style={styles.reviewComment}>"{rv.comment}"</Text>}
    </View>
));

const MetaItem = React.memo(({ label, value }) => (
    <View style={styles.metaItem}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue}>{value}</Text>
    </View>
));

const CustomerMenu = ({ navigation, route }) => {
    const { categoryId, itemId, filter } = route.params || {};
    const {
        addToCart,
        updateQuantity,
        getItemQuantity,
        getVariantQuantity,
        getCartId,
        cartTotal,
        cartCount
    } = useCart();
    const insets = useSafeAreaInsets();
    const { isOpen, ignoreStock } = useAppSettings();
    const { refreshTrigger } = useOrderNotification();
    const { popups } = usePopups('menu');

    const [menus, setMenus] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(categoryId || 'all');

    // Modal State
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const itemIdHandledRef = useRef(false);

    // Reusable Gesture for closing modal
    const { panY, panResponder, resetPan } = useSwipeToClose(() => setSelectedItem(null));

    // Reset panY when modal opens/closes
    useEffect(() => {
        if (selectedItem === null) {
            resetPan();
        }
    }, [selectedItem]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (categoryId) {
            setSelectedCategory(categoryId);
        } else if (filter) {
            setSelectedCategory('all');
        } else {
            setSelectedCategory('all');
        }
    }, [categoryId, filter]);

    useEffect(() => {
        fetchMenus();
    }, [searchTerm, selectedCategory, categories, filter, refreshTrigger]);

    useEffect(() => {
        if (itemId && menus.length > 0 && !itemIdHandledRef.current) {
            const item = menus.find(m => m.id === itemId);
            if (item) {
                itemIdHandledRef.current = true;
                handleOpenDetail(item);
            }
        }
    }, [itemId, menus]);

    const fetchInitialData = useCallback(async () => {
        try {
            const catRes = await apiService.get('/api/categories');
            if (catRes.data.data) {
                const visibleCategories = catRes.data.data.filter(c => c.is_visible !== 0 && c.is_visible !== false);
                setCategories(visibleCategories);
            }
        } catch (error) {
            console.error(error);
        }
    }, []);

    const fetchMenus = useCallback(async () => {
        setLoading(true);
        try {
            let url = '/api/menu-items?limit=100';
            if (selectedCategory !== 'all') {
                const cat = categories.find(c => c.id === selectedCategory);
                if (cat) {
                    url += `&category=${encodeURIComponent(cat.name)}`;
                }
            }

            const res = await apiService.get(url);
            let items = res.data.data || [];

            // Apply filter if any
            if (filter) {
                if (filter === 'Sedang Promo') {
                    items = items.filter(i => i.discount > 0);
                } else if (filter === 'Paling Laris') {
                    items = items.sort((a, b) => (parseFloat(b.average_rating) || 0) - (parseFloat(a.average_rating) || 0));
                } else if (filter === 'Terbaru') {
                    items = items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                } else if (filter === 'Paket Hemat') {
                    items = items.filter(i =>
                        (i.name && i.name.toLowerCase().includes('paket')) ||
                        (i.category && i.category.toLowerCase().includes('paket'))
                    );
                }
            }

            if (searchTerm) {
                items = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
            }
            setMenus(items);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, selectedCategory, categories]);

    const fetchReviews = useCallback(async (menuItemId) => {
        setReviewsLoading(true);
        try {
            const res = await apiService.get(`/api/menu-reviews/${menuItemId}`);
            if (res.data.message === 'success') {
                setReviews(res.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setReviewsLoading(false);
        }
    }, []);

    const getCategoryIcon = useCallback((categoryName) => {
        const name = categoryName ? categoryName.toUpperCase() : '';
        if (name.includes('AYAM') || name.includes('CHICKEN') || name.includes('BEBEK') || name.includes('DUCK')) return Drumstick;
        if (name.includes('IKAN') || name.includes('LELE') || name.includes('GURAME') || name.includes('SEAFOOD') || name.includes('NILA')) return Fish;
        if (name.includes('MINUM') || name.includes('ES') || name.includes('JUS') || name.includes('AIR')) return CupSoda;
        if (name.includes('KOPI') || name.includes('COFFEE') || name.includes('TEH') || name.includes('TEA')) return Coffee;
        if (name.includes('HEMAT') || name.includes('PROMO') || name.includes('PAKET') || name.includes('DISKON')) return Tag;
        if (name.includes('NASI') || name.includes('SOP') || name.includes('SOTO') || name.includes('MIE') || name.includes('BAKSO')) return Soup;
        if (name.includes('SNACK') || name.includes('CEMILAN') || name.includes('GORENGAN') || name.includes('KERUPUK')) return Cookie;
        if (name.includes('LAIN') || name.includes('EXTRA')) return MoreHorizontal;
        return Utensils;
    }, []);

    const handleOpenDetail = useCallback((item) => {
        setSelectedItem(item);
        setSelectedOptions([]);
        fetchReviews(item.id);
    }, [fetchReviews]);

    const formatCurrency = useCallback((val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val || 0);
    }, []);

    const renderMenuCard = useCallback(({ item }) => {
        const qty = getItemQuantity(item.id);
        return (
            <MenuCardItem
                item={item}
                qty={qty}
                isOpen={isOpen}
                ignoreStock={ignoreStock}
                onOpenDetail={handleOpenDetail}
                formatCurrency={formatCurrency}
            />
        );
    }, [getItemQuantity, isOpen, ignoreStock, handleOpenDetail, formatCurrency]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

            {/* Header / Search */}
            <View style={styles.header}>
                <View style={styles.searchWrap}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft size={20} color="#1E293B" />
                    </TouchableOpacity>
                    <View style={styles.searchInputWrap}>
                        <Search size={18} color="#94A3B8" />
                        <TextInput
                            placeholder="Bismillah, cari menu lezat..."
                            style={styles.searchInput}
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                    </View>
                </View>

                {/* Categories */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryTabs}
                    contentContainerStyle={styles.categoryTabsContent}
                >
                    <TouchableOpacity
                        style={[styles.tab, selectedCategory === 'all' && styles.activeTab]}
                        onPress={() => setSelectedCategory('all')}
                    >
                        <LayoutGrid size={14} color={selectedCategory === 'all' ? "#FFFFFF" : "#64748B"} style={{ marginRight: 6 }} />
                        <Text style={[styles.tabText, selectedCategory === 'all' && styles.activeTabText]}>Semua Berkah</Text>
                    </TouchableOpacity>
                    {categories.map(cat => {
                        const IconComponent = getCategoryIcon(cat.name);
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.tab, selectedCategory === cat.id && styles.activeTab]}
                                onPress={() => setSelectedCategory(cat.id)}
                            >
                                {cat.icon ? (
                                    <AppImage
                                        uri={cat.icon}
                                        style={{ width: 14, height: 14, marginRight: 6 }}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <IconComponent size={14} color={selectedCategory === cat.id ? "#FFFFFF" : "#64748B"} style={{ marginRight: 6 }} />
                                )}
                                <Text style={[styles.tabText, selectedCategory === cat.id && styles.activeTabText]}>{cat.name}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.loadingArea}>
                    <ActivityIndicator size="large" color="#059669" />
                </View>
            ) : (
                <FlatList
                    data={menus}
                    renderItem={renderMenuCard}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={11}
                    removeClippedSubviews={Platform.OS !== 'web'}
                    ListHeaderComponent={!isOpen && (
                        <View style={styles.closedWarning}>
                            <XCircle size={20} color="#FFFFFF" />
                            <View style={styles.closedWarningText}>
                                <Text style={styles.warningTitle}>Afwan, Toko Lagi Istirahat</Text>
                                <Text style={styles.warningSubtitle}>Sabar ya, insyaAllah nanti buka lagi. Doain ya!</Text>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyArea}>
                            <Search size={50} color="#E2E8F0" />
                            <Text style={styles.emptyText}>Maaf, menu belum ketemu nih...</Text>
                        </View>
                    }
                />
            )}

            {/* Float Cart */}
            {cartCount > 0 && (
                <View style={[styles.cartFloatContainer, { bottom: getSafeBottomPadding(insets, 20, 20) }]}>
                    <TouchableOpacity
                        style={styles.cartFloatBtn}
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate('Cart')}
                    >
                        <View style={styles.cartFloatLeft}>
                            <View style={styles.cartCountBadge}>
                                <Text style={styles.cartCountText}>{cartCount}</Text>
                            </View>
                            <View>
                                <Text style={styles.cartCountLabel}>Item di Keranjang</Text>
                                <Text style={styles.cartTotalPrice}>{formatCurrency(cartTotal)}</Text>
                            </View>
                        </View>
                        <View style={styles.cartFloatRight}>
                            <Text style={styles.cartActionText}>Ke Keranjang</Text>
                            <ShoppingBag size={18} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                </View>
            )}

            {/* Detail Modal */}
            <Modal
                visible={selectedItem !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedItem(null)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.modalContent,
                            {
                                transform: [{
                                    translateY: panY.interpolate({
                                        inputRange: [-1, 0, height],
                                        outputRange: [0, 0, height],
                                    })
                                }]
                            }
                        ]}
                    >
                        {/* Invisible Drag Handle for Gesture */}
                        <View style={styles.modalDragHandle} {...panResponder.panHandlers} />

                        {/* Image Header */}
                        <View style={styles.modalImageWrap} {...panResponder.panHandlers}>
                            <AppImage
                                uri={selectedItem?.image_url}
                                style={styles.modalImage}
                                placeholderIcon={ImageIcon}
                            />
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setSelectedItem(null)}
                            >
                                <ArrowLeft size={24} color="#1E293B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={styles.modalPadding}>
                                <Text style={styles.modalName}>{selectedItem?.name}</Text>
                                <View style={styles.modalPriceRow}>
                                    {selectedItem?.discount > 0 && (
                                        <Text style={styles.modalOldPrice}>{formatCurrency(selectedItem.price)}</Text>
                                    )}
                                    <Text style={styles.modalPrice}>
                                        {formatCurrency(Math.round(selectedItem?.discount > 0 ? selectedItem.price * (1 - selectedItem.discount / 100) : selectedItem?.price))}
                                    </Text>
                                </View>
                                <Text style={styles.modalDesc}>{selectedItem?.description || 'Menu lezat bin berkah yang disiapkan spesial untuk Anda.'}</Text>

                                {/* Options */}
                                {selectedItem?.options && selectedItem.options.length > 0 && (
                                    <View style={styles.optionsSection}>
                                        <Text style={styles.optionsTitle}>Pilih yang kamu suka ya (Wajib Pilih)</Text>
                                        {selectedItem.options.map((opt) => {
                                            const isSelected = selectedOptions.some(o => o.id === opt.id);
                                            return (
                                                <TouchableOpacity
                                                    key={opt.id}
                                                    style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                                                    onPress={() => setSelectedOptions([opt])}
                                                >
                                                    <View style={styles.optionLeft}>
                                                        <View style={[styles.radio, isSelected && styles.radioActive]}>
                                                            {isSelected && <View style={styles.radioInner} />}
                                                        </View>
                                                        <Text style={[styles.optionName, isSelected && styles.optionNameActive]}>{opt.name}</Text>
                                                    </View>
                                                    <Text style={styles.optionPrice}>+{formatCurrency(opt.price_adjustment)}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}

                                {/* Stock Info */}
                                <View style={styles.metaRow}>
                                    <MetaItem label="Kategori" value={selectedItem?.category || '-'} />
                                    <MetaItem label="Stok" value={ignoreStock ? '∞' : `${selectedItem?.stock || 0} Porsi`} />
                                </View>

                                {/* Reviews */}
                                <View style={styles.reviewsSection}>
                                    <View style={styles.reviewsHeader}>
                                        <Text style={styles.reviewsTitle}>Kata Mereka Yang Sudah Coba</Text>
                                        {selectedItem?.total_reviews > 0 && (
                                            <View style={styles.averageRatingWrap}>
                                                <Star size={14} color="#FBBF24" fill="#FBBF24" />
                                                <Text style={styles.averageRatingText}>{parseFloat(selectedItem.average_rating).toFixed(1)}</Text>
                                                <Text style={styles.totalReviewsText}>({selectedItem.total_reviews})</Text>
                                            </View>
                                        )}
                                    </View>

                                    {reviewsLoading ? (
                                        <ActivityIndicator color="#059669" style={{ marginVertical: 20 }} />
                                    ) : reviews.length > 0 ? (
                                        reviews.map((rv, idx) => (
                                            <ReviewItem key={idx} rv={rv} />
                                        ))
                                    ) : (
                                        <View style={styles.emptyReviews}>
                                            <MessageSquare size={30} color="#E2E8F0" />
                                            <Text style={styles.emptyReviewsText}>Belum ada testi nih, yuk jajan!</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={{ height: 100 }} />
                            </View>
                        </ScrollView>

                        {/* Modal Footer */}
                        <View style={[styles.modalFooter, { paddingBottom: getSafeBottomPadding(insets) }]}>
                            {(() => {
                                const modalIsOutOfStock = !ignoreStock && selectedItem?.stock <= 0;

                                if (getVariantQuantity(selectedItem?.id, selectedOptions) === 0) {
                                    const isAddDisabled = (selectedItem?.options?.length > 0 && selectedOptions.length === 0) || modalIsOutOfStock;
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.addToCartLarge,
                                                isAddDisabled && styles.addToCartDisabled
                                            ]}
                                            disabled={isAddDisabled}
                                            onPress={() => {
                                                addToCart(selectedItem, 1, selectedOptions);
                                            }}
                                        >
                                            <Text style={styles.addToCartText}>{modalIsOutOfStock ? 'Afwan, Habis Terjual' : 'Bismillah, Masukkan Keranjang'}</Text>
                                            {!modalIsOutOfStock && (
                                                <Text style={styles.addToCartLargePrice}>
                                                    {formatCurrency(Math.round(
                                                        (selectedItem?.discount > 0 ? selectedItem.price * (1 - selectedItem.discount / 100) : selectedItem?.price) +
                                                        selectedOptions.reduce((acc, opt) => acc + (parseFloat(opt.price_adjustment) || 0), 0)
                                                    ))}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                } else {
                                    const currentQty = getVariantQuantity(selectedItem.id, selectedOptions);
                                    const cartId = getCartId(selectedItem.id, selectedOptions);

                                    return (
                                        <View style={styles.qtyControlRow}>
                                            <View style={styles.qtyBox}>
                                                <TouchableOpacity
                                                    style={styles.qtyBtn}
                                                    activeOpacity={0.7}
                                                    onPress={() => {
                                                        if (cartId) updateQuantity(cartId, -1);
                                                    }}
                                                >
                                                    <Minus size={20} color="#1E293B" />
                                                </TouchableOpacity>
                                                <Text style={styles.qtyVal}>{currentQty}</Text>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.qtyBtn,
                                                        { backgroundColor: modalIsOutOfStock ? '#E2E8F0' : '#059669' }
                                                    ]}
                                                    activeOpacity={0.7}
                                                    disabled={modalIsOutOfStock}
                                                    onPress={() => {
                                                        if (cartId && !modalIsOutOfStock) updateQuantity(cartId, 1);
                                                    }}
                                                >
                                                    <Plus size={20} color={modalIsOutOfStock ? "#94A3B8" : "#FFFFFF"} />
                                                </TouchableOpacity>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.saveBtn}
                                                activeOpacity={0.8}
                                                onPress={() => setSelectedItem(null)}
                                            >
                                                <Text style={styles.saveBtnText}>Simpan</Text>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                }
                            })()}
                        </View>
                    </Animated.View>
                </View>
            </Modal>

            {/* Popup System */}
            <PopupModal
                popups={popups}
                currentPage="menu"
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
    loadingArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : (Platform.OS === 'web' ? 15 : 20),
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
        gap: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchInputWrap: {
        flex: 1,
        height: 44,
        backgroundColor: '#F1F5F9',
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#1E293B',
    },
    categoryTabs: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    categoryTabsContent: {
        paddingRight: 32,
        paddingBottom: 4,
        gap: 8,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    activeTab: {
        backgroundColor: '#059669',
    },
    tabText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    listContent: {
        padding: 16,
        paddingBottom: 120,
    },
    closedWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        padding: 12,
        borderRadius: 16,
        marginBottom: 20,
        gap: 12,
    },
    closedWarningText: {
        flex: 1,
    },
    warningTitle: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    warningSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
    },
    menuRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' },
            android: { elevation: 2 }
        })
    },
    menuRowClosed: {
        opacity: 0.6,
    },
    menuImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 15,
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
    },
    menuImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    menuImagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowDiscountBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        backgroundColor: '#EF4444',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    rowDiscountText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: '900',
    },
    menuInfoContainer: {
        flex: 1,
        marginLeft: 14,
        justifyContent: 'space-between',
    },
    rowNameHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rowName: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
        flex: 1,
    },
    rowRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    rowRatingText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#D97706',
    },
    rowDesc: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 4,
        lineHeight: 16,
    },
    rowFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 8,
    },
    rowOldPrice: {
        fontSize: 10,
        color: '#94A3B8',
        textDecorationLine: 'line-through',
    },
    rowPrice: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
    },
    rowQtyBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    rowQtyText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#059669',
    },
    rowAddBtn: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    rowAddBtnDisabled: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
    },
    rowAddText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#059669',
    },
    emptyArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    cartFloatContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 50,
    },
    cartFloatBtn: {
        backgroundColor: '#059669',
        height: 64,
        borderRadius: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0px 10px 25px rgba(5, 150, 105, 0.3)' },
            android: { elevation: 10 }
        })
    },
    cartFloatLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cartCountBadge: {
        width: 32,
        height: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    cartCountText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
    },
    cartCountLabel: {
        fontSize: 10,
        color: '#D1FAE5',
        fontWeight: 'bold',
    },
    cartTotalPrice: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '900',
    },
    cartFloatRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cartActionText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        height: '92%',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        overflow: 'hidden',
    },
    modalImageWrap: {
        width: '100%',
        height: 300,
        backgroundColor: '#F1F5F9',
    },
    modalImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    modalImagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalDragHandle: {
        width: '100%',
        height: 30,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        zIndex: 50,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
    },
    modalDragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 20,
        left: 20,
        width: 44,
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        flex: 1,
    },
    modalPadding: {
        padding: 24,
    },
    modalName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
    },
    modalPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    modalOldPrice: {
        fontSize: 14,
        color: '#94A3B8',
        textDecorationLine: 'line-through',
    },
    modalPrice: {
        fontSize: 20,
        fontWeight: '900',
        color: '#059669',
    },
    modalDesc: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
        marginBottom: 30,
    },
    optionsSection: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 24,
        marginBottom: 24,
    },
    optionsTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 14,
        letterSpacing: 0.5,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    optionItemSelected: {
        borderColor: '#059669',
        backgroundColor: '#ECFDF5',
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioActive: {
        borderColor: '#059669',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#059669',
    },
    optionName: {
        fontSize: 14,
        color: '#475569',
        fontWeight: 'bold',
    },
    optionNameActive: {
        color: '#1E293B',
    },
    optionPrice: {
        fontSize: 13,
        fontWeight: '900',
        color: '#64748B',
    },
    metaRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    metaItem: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
    },
    metaLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 4,
    },
    metaValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
    },
    reviewsSection: {
        marginBottom: 40,
    },
    reviewsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    reviewsTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    averageRatingWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    averageRatingText: {
        fontSize: 13,
        fontWeight: '900',
        color: '#D97706',
    },
    totalReviewsText: {
        fontSize: 10,
        color: '#F59E0B',
        fontWeight: 'bold',
    },
    reviewItem: {
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    reviewUserWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    userAvatar: {
        width: 36,
        height: 36,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userAvatarText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#64748B',
    },
    reviewUser: {
        fontSize: 13,
        fontWeight: '900',
        color: '#1E293B',
    },
    starsRow: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 2,
    },
    reviewDate: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    reviewComment: {
        fontSize: 13,
        color: '#475569',
        marginLeft: 46,
        lineHeight: 18,
        fontStyle: 'italic',
    },
    emptyReviews: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        backgroundColor: '#F8FAFC',
        borderRadius: 25,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#E2E8F0',
    },
    emptyReviewsText: {
        marginTop: 10,
        fontSize: 12,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
    },
    modalFooter: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    addToCartLarge: {
        backgroundColor: '#059669',
        height: 60,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        ...Platform.select({
            web: { boxShadow: '0px 10px 25px rgba(5, 150, 105, 0.3)' },
            android: { elevation: 8 }
        })
    },
    addToCartDisabled: {
        backgroundColor: '#CBD5E1',
    },
    addToCartText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
    },
    addToCartLargePrice: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },
    qtyControlRow: {
        flexDirection: 'row',
        gap: 16,
    },
    qtyBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        padding: 4,
        borderRadius: 18,
        gap: 12,
    },
    qtyBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyVal: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
        minWidth: 24,
        textAlign: 'center',
    },
    saveBtn: {
        flex: 1,
        backgroundColor: '#059669',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
    },
    outOfStockBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    outOfStockText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    textMuted: {
        color: '#94A3B8',
    }
});

export default CustomerMenu;
