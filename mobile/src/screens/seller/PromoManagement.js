import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
    RefreshControl,
    Platform,
    FlatList,
    PanResponder,
    Animated,
    KeyboardAvoidingView,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';
const { width } = Dimensions.get('window');
import {
    Ticket,
    Plus,
    Trash2,
    Edit2,
    ChevronLeft,
    Calendar,
    Hash,
    Type,
    CheckCircle2,
    XCircle,
    Palette,
    Banknote,
    Percent,
    ShoppingBag,
    X,
    Truck,
    Zap,
    Gift,
    Wallet,
    Tags,
    Info,
    Sparkles,
    Image,
    ImageIcon
} from 'lucide-react-native';
import apiService from '../../api/apiService';

// Memoized Promo Item Component for better performance
const getIcon = (iconName, size, color) => {
    const props = { size, color };
    switch (iconName) {
        case 'Truck': return <Truck {...props} />;
        case 'Zap': return <Zap {...props} />;
        case 'Gift': return <Gift {...props} />;
        case 'Percent': return <Percent {...props} />;
        case 'Wallet': return <Wallet {...props} />;
        case 'Tags': return <Tags {...props} />;
        default: return <Ticket {...props} />;
    }
};

const PromoItem = React.memo(({ promo, onEdit, onDelete, onToggle }) => {
    // Determine type label and styling
    let typeLabel = 'Otomatis';
    let typeColor = '#4B5563'; // Gray 600
    let typeBg = '#F3F4F6'; // Gray 100
    let typeIcon = <Zap size={12} color={typeColor} />;

    if (promo.is_hero) {
        typeLabel = 'Banner Utama';
        typeColor = '#7C3AED'; // Violet 600
        typeBg = '#F3E8FF'; // Violet 100
        typeIcon = <Sparkles size={12} color={typeColor} />;
    } else if (promo.code) {
        typeLabel = 'Voucher';
        typeColor = '#059669'; // Emerald 600
        typeBg = '#ECFDF5'; // Emerald 100
        typeIcon = <Ticket size={12} color={typeColor} />;
    }

    return (
        <View style={styles.promoCard}>
            {/* Header: Type Badge & Status */}
            <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, { backgroundColor: typeBg }]}>
                    {typeIcon}
                    <Text style={[styles.typeBadgeText, { color: typeColor }]}>{typeLabel}</Text>
                </View>
                <TouchableOpacity onPress={() => onToggle(promo)} activeOpacity={0.7}>
                    <View style={[styles.statusBadge, { backgroundColor: promo.is_active ? '#DCFCE7' : '#FEE2E2' }]}>
                        <Text style={[styles.statusText, { color: promo.is_active ? '#15803D' : '#B91C1C' }]}>
                            {promo.is_active ? 'Aktif' : 'Non-Aktif'}
                        </Text>
                        {promo.is_active ? <CheckCircle2 size={14} color="#15803D" /> : <XCircle size={14} color="#B91C1C" />}
                    </View>
                </TouchableOpacity>
            </View>

            {/* Body: Icon, Title, Discount */}
            <View style={styles.cardBody}>
                <View style={[styles.promoIconContainer, { backgroundColor: promo.color + '15' }]}>
                    {getIcon(promo.icon, 28, promo.color)}
                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.promoTitle} numberOfLines={1}>{promo.title}</Text>

                    <View style={styles.discountContainer}>
                        <Text style={[styles.promoDiscount, { color: promo.color }]}>
                            {promo.discount_type === 'percentage'
                                ? `${promo.discount_value}% OFF`
                                : `Rp ${parseFloat(promo.discount_value).toLocaleString('id-ID')}`}
                        </Text>
                        {promo.code && (
                            <View style={styles.codePill}>
                                <Hash size={12} color="#6B7280" />
                                <Text style={styles.codeText}>{promo.code}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Divider */}
            <View style={styles.cardDivider} />

            {/* Footer: Details & Actions */}
            <View style={styles.cardFooter}>
                <View style={styles.metaContainer}>
                    <View style={styles.metaItem}>
                        <Calendar size={14} color="#9CA3AF" />
                        <Text style={styles.metaText}>{promo.expiry || 'Tanpa Batas'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <ShoppingBag size={14} color="#9CA3AF" />
                        <Text style={styles.metaText}>Min. {parseInt(promo.min_purchase) > 0 ? `Rp ${parseFloat(promo.min_purchase).toLocaleString('id-ID')}` : 'Rp 0'}</Text>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => onEdit(promo)}>
                        <Edit2 size={16} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => onDelete(promo.id)}>
                        <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
});

const BannerItem = React.memo(({ item, onEdit }) => (
    <TouchableOpacity
        style={styles.bannerItem}
        activeOpacity={0.9}
        onPress={() => onEdit(item)}
    >
        <View style={[styles.bannerCard, { backgroundColor: item.color || '#059669' }]}>
            {/* Background Pattern/Image */}
            <View style={styles.bannerBackground}>
                {item.image_url ? (
                    <Animated.Image
                        source={{ uri: item.image_url }}
                        style={styles.bannerImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.patternOverlay} />
                )}
            </View>

            <View style={styles.bannerContent}>
                {item.badge_text ? (
                    <View style={styles.bannerBadge}>
                        <Text style={styles.bannerBadgeText}>{item.badge_text}</Text>
                    </View>
                ) : null}

                <Text style={styles.bannerTitle} numberOfLines={2}>
                    {item.title}
                </Text>

                <View style={styles.bannerFooter}>
                    <View style={styles.bannerCode}>
                        <Text style={styles.bannerCodeText}>
                            {item.code || 'TANPA KODE'}
                        </Text>
                    </View>
                    <Text style={styles.bannerExpiry}>
                        Berlaku s/d {item.expiry || 'Seterusnya'}
                    </Text>
                </View>
            </View>

            {/* Edit Indicator */}
            <View style={styles.bannerEditBtn}>
                <Edit2 size={16} color="#FFFFFF" />
            </View>
        </View>
    </TouchableOpacity>
));

const BannerCarousel = React.memo(({ promos, onEdit }) => {
    if (!promos || promos.length === 0) {
        return (
            <TouchableOpacity
                style={styles.emptyBannerContainer}
                onPress={() => onEdit(null, true)} // Pass true to pre-select hero
            >
                <View style={styles.emptyBannerContent}>
                    <Sparkles size={32} color="#D1D5DB" />
                    <Text style={styles.emptyBannerText}>Tambahkan Banner Promosi</Text>
                    <Text style={styles.emptyBannerSubText}>Klik untuk buat banner baru</Text>
                </View>
            </TouchableOpacity>
        );
    }

    const renderBanner = useCallback(({ item }) => (
        <BannerItem item={item} onEdit={onEdit} />
    ), [onEdit]);

    return (
        <View style={styles.carouselContainer}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Banner & Highlight</Text>
            </View>

            <FlatList
                data={promos}
                renderItem={renderBanner}
                keyExtractor={item => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled={false}
                snapToInterval={width - 40}
                decelerationRate="fast"
                contentContainerStyle={styles.carouselContent}
                initialNumToRender={3} // Optimize initial render
                maxToRenderPerBatch={3}
                windowSize={3}
                removeClippedSubviews={true}
            />
        </View>
    );
});

const PromoManagement = ({ navigation }) => {
    const [promos, setPromos] = useState([]);
    // Remove heroPromos state, rely on useMemo
    const heroPromos = useMemo(() => promos.filter(p => p.is_hero), [promos]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [promoMode, setPromoMode] = useState('voucher'); // 'voucher' | 'automatic' | 'banner'

    // Delete Modal State
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [promoToDelete, setPromoToDelete] = useState(null);

    const [form, setForm] = useState({
        title: '',
        description: '',
        code: '',
        icon: 'Ticket',
        color: '#059669',
        expiry: '',
        is_active: true,
        discount_value: '',
        discount_type: 'fixed',
        min_purchase: '',
        is_hero: false,
        badge_text: '',
        image_url: ''
    });

    // Pan Responder for swipe down gesture
    const panY = React.useRef(new Animated.Value(0)).current;

    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only respond to vertical swipes
                return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                // Only allow downward swipes
                if (gestureState.dy > 0) {
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // Close modal if swiped down more than 100px
                if (gestureState.dy > 100) {
                    setModalVisible(false);
                    Animated.timing(panY, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }).start();
                } else {
                    // Snap back to original position
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const fetchPromos = useCallback(async (isQuiet = false) => {
        if (!isQuiet) setLoading(true);
        try {
            const response = await apiService.get('/api/promos');
            if (response.data && response.data.data) {
                setPromos(response.data.data);
                // setHeroPromos derived automatically
            }
        } catch (error) {
            console.error('Error fetching promos:', error);
            Alert.alert('Error', 'Gagal mengambil data promo');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchPromos();
    }, [fetchPromos]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchPromos(true);
    }, [fetchPromos]);

    const handleOpenModal = useCallback((promo = null, startAsHero = false) => {
        if (promo) {
            setEditingPromo(promo);
            // Detect mode: 
            // - is_hero -> banner
            // - code exists -> voucher
            // - else -> automatic
            if (promo.is_hero) {
                setPromoMode('banner');
            } else if (promo.code) {
                setPromoMode('voucher');
            } else {
                setPromoMode('automatic');
            }

            setForm({
                title: promo.title,
                description: promo.description || '',
                code: promo.code || '',
                icon: promo.icon || 'Ticket',
                color: promo.color || '#059669',
                expiry: promo.expiry || '',
                is_active: !!promo.is_active,
                discount_value: promo.discount_value?.toString() || '',
                discount_type: promo.discount_type || 'fixed',
                min_purchase: promo.min_purchase?.toString() || '',
                is_hero: !!promo.is_hero,
                badge_text: promo.badge_text || '',
                image_url: promo.image_url || ''
            });
        } else {
            setEditingPromo(null);
            // If startAsHero is true, force banner mode
            setPromoMode(startAsHero ? 'banner' : 'voucher');
            setForm({
                title: '',
                description: '',
                code: '',
                icon: 'Ticket',
                color: '#059669',
                expiry: '',
                is_active: true,
                discount_value: '',
                discount_type: 'fixed',
                min_purchase: '',
                is_hero: startAsHero, // Set based on startAsHero for new promos
                badge_text: '',
                image_url: ''
            });
        }
        setModalVisible(true);
    }, []);

    const handleSubmit = async () => {
        if (!form.title && promoMode !== 'banner') { // Title is optional for banner if badge_text is main
            Alert.alert('Peringatan', 'Judul promo wajib diisi');
            return;
        }
        if (promoMode === 'banner' && !form.badge_text) {
            Alert.alert('Peringatan', 'Teks Badge wajib diisi untuk Banner');
            return;
        }

        if (promoMode === 'voucher' && !form.code) {
            Alert.alert('Peringatan', 'Kode promo wajib diisi untuk jenis Voucher');
            return;
        }

        try {
            const cleanedForm = {
                ...form,
                // Adjust fields based on promoMode
                is_hero: promoMode === 'banner' ? true : false, // Force is_hero for banner mode, false for others
                code: promoMode === 'voucher' ? form.code : '', // Only keep code for voucher mode
                min_purchase: form.min_purchase ? form.min_purchase.toString().replace(/[^\d.]/g, '') : 0,
                discount_value: form.discount_value ? form.discount_value.toString().replace(/[^\d.]/g, '') : 0,
                // For banner mode, ensure icon is null/default and description is optional
                icon: promoMode === 'banner' ? null : form.icon,
                description: promoMode === 'banner' ? form.description : form.description, // Description is common
            };

            if (editingPromo) {
                await apiService.put(`/api/promos/${editingPromo.id}`, cleanedForm);
                Alert.alert('Sukses', 'Promo berhasil diperbarui');
            } else {
                await apiService.post('/api/promos', cleanedForm);
                Alert.alert('Sukses', 'Promo baru berhasil ditambahkan');
            }
            setModalVisible(false);
            fetchPromos(true);
        } catch (error) {
            console.error('Error submitting promo:', error);
            const msg = error.response?.data?.error || 'Gagal menyimpan promo';
            Alert.alert('Error', msg);
        }
    };

    const handleDelete = useCallback((id) => {
        setPromoToDelete(id);
        setDeleteModalVisible(true);
    }, []);

    const confirmDelete = async () => {
        if (!promoToDelete) return;
        try {
            await apiService.delete(`/api/promos/${promoToDelete}`);
            fetchPromos(true);
            setDeleteModalVisible(false);
            setPromoToDelete(null);
        } catch (error) {
            console.error('Error deleting promo:', error);
            Alert.alert('Error', 'Gagal menghapus promo');
            setDeleteModalVisible(false);
        }
    };

    const toggleStatus = useCallback(async (promo) => {
        try {
            const newStatus = !promo.is_active;
            await apiService.put(`/api/promos/${promo.id}`, {
                ...promo,
                is_active: newStatus
            });
            fetchPromos(true);
        } catch (error) {
            Alert.alert('Error', 'Gagal mengubah status promo');
        }
    }, [fetchPromos]);

    const renderPromoItem = useCallback(({ item }) => (
        <PromoItem
            promo={item}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
            onToggle={toggleStatus}
        />
    ), [handleOpenModal, handleDelete, toggleStatus]);

    const ListEmptyComponent = useMemo(() => (
        <View style={styles.emptyContainer}>
            <Ticket size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Belum ada promo aktif</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => handleOpenModal()}>
                <Text style={styles.emptyAddBtnText}>Buat Promo Pertama</Text>
            </TouchableOpacity>
        </View>
    ), [handleOpenModal]);

    const headerComponent = useMemo(() => (
        <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <ChevronLeft size={24} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Manajemen Promo</Text>
                <Text style={styles.headerSubtitle}>Kelola Voucher & Kampanye</Text>
            </View>
            <TouchableOpacity style={styles.addBtnHeader} onPress={() => handleOpenModal()}>
                <Plus size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    ), [navigation, handleOpenModal]);

    const mainListHeader = useMemo(() => (
        <View>
            <BannerCarousel promos={heroPromos} onEdit={handleOpenModal} />
            <View style={styles.listHeaderContainer}>
                <Text style={styles.listTitle}>Daftar Promo Aktif</Text>
            </View>
        </View>
    ), [heroPromos, handleOpenModal]);

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }


    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {headerComponent}

            <FlatList
                data={promos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPromoItem}
                ListHeaderComponent={mainListHeader}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
                ListEmptyComponent={ListEmptyComponent}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={Platform.OS !== 'web'}
            />

            {/* Float Button */}
            {promos.length > 0 && (
                <TouchableOpacity style={styles.fab} onPress={() => handleOpenModal()}>
                    <Plus size={28} color="#FFFFFF" />
                </TouchableOpacity>
            )}

            {/* Modal Form */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.modalContent,
                            {
                                transform: [{ translateY: panY }]
                            }
                        ]}
                    >
                        {/* Swipe Handle Bar */}
                        <View
                            style={styles.handleBarContainer}
                            {...panResponder.panHandlers}
                        >
                            <View style={styles.handleBar} />
                        </View>

                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingPromo ? 'Edit Promo' : 'Buat Promo Baru'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        {/* Mode Selector / Tabs */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tabBtn, promoMode === 'voucher' && styles.tabBtnActive]}
                                onPress={() => setPromoMode('voucher')}
                            >
                                <Ticket size={16} color={promoMode === 'voucher' ? '#fff' : '#6B7280'} />
                                <Text style={[styles.tabText, promoMode === 'voucher' && styles.tabTextActive]}>Voucher</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabBtn, promoMode === 'automatic' && styles.tabBtnActive]}
                                onPress={() => setPromoMode('automatic')}
                            >
                                <Zap size={16} color={promoMode === 'automatic' ? '#fff' : '#6B7280'} />
                                <Text style={[styles.tabText, promoMode === 'automatic' && styles.tabTextActive]}>Otomatis</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabBtn, promoMode === 'banner' && styles.tabBtnActive]}
                                onPress={() => setPromoMode('banner')}
                            >
                                <ImageIcon size={16} color={promoMode === 'banner' ? '#fff' : '#6B7280'} />
                                <Text style={[styles.tabText, promoMode === 'banner' && styles.tabTextActive]}>Banner</Text>
                            </TouchableOpacity>
                        </View>

                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{ flex: 1 }}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                        >
                            <FlatList
                                style={{ flex: 1 }}
                                data={[1]} // Dummy for single scrollable form
                                keyExtractor={() => 'form'}
                                renderItem={() => (
                                    <View style={styles.formContainer}>

                                        {/* BANNER SPECIFIC FIELDS */}
                                        {promoMode === 'banner' && (
                                            <View style={styles.bannerSettingsContainer}>
                                                <Text style={styles.sectionHeaderTitle}>Pengaturan Tampilan Banner</Text>

                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.subLabel}>Teks Badge (Wajib)</Text>
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="Contoh: FLASH SALE"
                                                        value={form.badge_text}
                                                        onChangeText={(text) => setForm({ ...form, badge_text: text })}
                                                    />
                                                </View>

                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.subLabel}>Judul Banner</Text>
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="Judul menarik untuk banner..."
                                                        value={form.title}
                                                        onChangeText={(text) => setForm({ ...form, title: text })}
                                                    />
                                                </View>

                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.subLabel}>URL Gambar Background</Text>
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="https://..."
                                                        value={form.image_url}
                                                        onChangeText={(text) => setForm({ ...form, image_url: text })}
                                                    />
                                                    <Text style={styles.inputHint}>*Gunakan link gambar langsung (jpg/png)</Text>
                                                </View>

                                                <View style={styles.inputGroup}>
                                                    <View style={styles.inputLabelContainer}>
                                                        <Palette size={16} color="#6B7280" />
                                                        <Text style={styles.inputLabel}>Warna Tema Banner</Text>
                                                    </View>
                                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPicker}>
                                                        {['#059669', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#111827'].map((c) => (
                                                            <TouchableOpacity
                                                                key={c}
                                                                style={[
                                                                    styles.colorOption,
                                                                    { backgroundColor: c },
                                                                    form.color === c && styles.selectedColor
                                                                ]}
                                                                onPress={() => setForm({ ...form, color: c })}
                                                            >
                                                                {form.color === c && <CheckCircle2 size={16} color="#FFFFFF" />}
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                </View>
                                            </View>
                                        )}


                                        {/* NON-BANNER FIELDS (Common) */}
                                        {promoMode !== 'banner' && (
                                            <View style={styles.inputGroup}>
                                                <View style={styles.inputLabelContainer}>
                                                    <Type size={16} color="#6B7280" />
                                                    <Text style={styles.inputLabel}>Judul Promo</Text>
                                                </View>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Contoh: Diskon Merdeka"
                                                    value={form.title}
                                                    onChangeText={(text) => setForm({ ...form, title: text })}
                                                />
                                            </View>
                                        )}

                                        {/* VOUCHER SPECIFIC: CODE */}
                                        {promoMode === 'voucher' && (
                                            <View style={styles.inputGroup}>
                                                <View style={styles.inputLabelContainer}>
                                                    <Hash size={16} color="#6B7280" />
                                                    <Text style={styles.inputLabel}>Kode Voucher (Wajib)</Text>
                                                </View>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Contoh: MERDEKA45"
                                                    value={form.code}
                                                    onChangeText={(text) => setForm({ ...form, code: text })}
                                                    autoCapitalize="characters"
                                                />
                                            </View>
                                        )}

                                        {/* COMMON DETAILS FOR ALL MODES */}
                                        <View style={styles.sectionDivider}>
                                            <Text style={styles.sectionDividerText}>Detail Keuntungan</Text>
                                        </View>

                                        <View style={styles.rowContainer}>
                                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                                <Text style={styles.subLabel}>Masa Berlaku</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="s/d 31 Des"
                                                    value={form.expiry}
                                                    onChangeText={(text) => setForm({ ...form, expiry: text })}
                                                />
                                            </View>
                                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                                                <Text style={styles.subLabel}>Min. Belanja (Rp)</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="0"
                                                    value={form.min_purchase}
                                                    onChangeText={(text) => setForm({ ...form, min_purchase: text })}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <View style={styles.inputLabelContainer}>
                                                <Banknote size={16} color="#6B7280" />
                                                <Text style={styles.inputLabel}>Besar Potongan/Diskon</Text>
                                            </View>
                                            <View style={styles.discountRow}>
                                                <View style={styles.discountTypeContainer}>
                                                    <TouchableOpacity
                                                        style={[styles.typeBtn, form.discount_type === 'fixed' && styles.typeBtnActive]}
                                                        onPress={() => setForm({ ...form, discount_type: 'fixed' })}
                                                    >
                                                        <Text style={[styles.typeBtnText, form.discount_type === 'fixed' && styles.typeBtnTextActive]}>Rp</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.typeBtn, form.discount_type === 'percentage' && styles.typeBtnActive]}
                                                        onPress={() => setForm({ ...form, discount_type: 'percentage' })}
                                                    >
                                                        <Text style={[styles.typeBtnText, form.discount_type === 'percentage' && styles.typeBtnTextActive]}>%</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <TextInput
                                                    style={[styles.input, { flex: 1 }]}
                                                    placeholder="Nominal..."
                                                    value={form.discount_value}
                                                    onChangeText={(text) => setForm({ ...form, discount_value: text })}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                        </View>

                                        {/* Visuals for Non-Banner */}
                                        {promoMode !== 'banner' && (
                                            <View style={styles.inputGroup}>
                                                <View style={styles.inputLabelContainer}>
                                                    <Palette size={16} color="#6B7280" />
                                                    <Text style={styles.inputLabel}>Tampilan & Warna</Text>
                                                </View>
                                                <View style={styles.iconPicker}>
                                                    {['Ticket', 'Zap', 'Gift', 'Truck', 'Percent', 'Wallet', 'Tags'].map((icon) => (
                                                        <TouchableOpacity
                                                            key={icon}
                                                            style={[
                                                                styles.iconOption,
                                                                form.icon === icon && { backgroundColor: form.color + '20', borderColor: form.color }
                                                            ]}
                                                            onPress={() => setForm({ ...form, icon })}
                                                        >
                                                            {getIcon(icon, 20, form.icon === icon ? form.color : '#9CA3AF')}
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                                <View style={[styles.colorPicker, { marginTop: 10 }]}>
                                                    {['#059669', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'].map((c) => (
                                                        <TouchableOpacity
                                                            key={c}
                                                            style={[
                                                                styles.colorOption,
                                                                { backgroundColor: c },
                                                                form.color === c && styles.selectedColor
                                                            ]}
                                                            onPress={() => setForm({ ...form, color: c })}
                                                        >
                                                            {form.color === c && <CheckCircle2 size={16} color="#FFFFFF" />}
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            </View>
                                        )}

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Keterangan Tambahan</Text>
                                            <TextInput
                                                style={[styles.input, styles.textArea]}
                                                placeholder="Syarat & Ketentuan..."
                                                value={form.description}
                                                onChangeText={(text) => setForm({ ...form, description: text })}
                                                multiline={true}
                                                numberOfLines={3}
                                            />
                                        </View>
                                    </View>
                                )}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={{ paddingBottom: 20 }}
                            />
                            {/* Fixed Footer Button */}
                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={[styles.submitBtn, { backgroundColor: form.color }]}
                                    onPress={handleSubmit}
                                >
                                    <Text style={styles.submitBtnText}>
                                        {editingPromo ? 'Simpan Perubahan' : 'Buat Promo Baru'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </Animated.View>
                </View>
            </Modal>

            {/* Custom Delete Confirmation Modal */}
            <Modal
                visible={deleteModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.alertContent}>
                        <View style={styles.alertIconContainer}>
                            <Trash2 size={32} color="#EF4444" />
                        </View>
                        <Text style={styles.alertTitle}>Hapus Promo?</Text>
                        <Text style={styles.alertMessage}>
                            Promo yang dihapus tidak dapat dikembalikan. Apakah Anda yakin ingin melanjutkan?
                        </Text>
                        <View style={styles.alertActions}>
                            <TouchableOpacity
                                style={[styles.alertBtn, styles.alertBtnCancel]}
                                onPress={() => setDeleteModalVisible(false)}
                            >
                                <Text style={styles.alertBtnTextCancel}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.alertBtn, styles.alertBtnDelete]}
                                onPress={confirmDelete}
                            >
                                <Text style={styles.alertBtnTextDelete}>Hapus</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    // ... rest of styles
    inputHint: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 4,
        fontStyle: 'italic',
    },
    iconPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 10,
    },
    iconOption: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backBtn: {
        padding: 5,
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    addBtnHeader: {
        backgroundColor: '#059669',
        borderRadius: 10,
        padding: 8,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    promoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    typeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    promoIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    promoTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    discountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    promoDiscount: {
        fontSize: 16,
        fontWeight: '800',
    },
    codePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    codeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4B5563',
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaContainer: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBtn: {
        backgroundColor: '#EFF6FF', // Blue 50
    },
    deleteBtn: {
        backgroundColor: '#FEF2F2', // Red 50
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#059669',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 15,
    },
    emptyAddBtn: {
        marginTop: 20,
        backgroundColor: '#059669',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    emptyAddBtnText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '90%', // Slight increase for better editing space
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    carouselContainer: {
        marginBottom: 20,
    },
    carouselContent: {
        paddingRight: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    seeAllText: {
        fontSize: 13,
        color: '#059669',
        fontWeight: '600',
    },
    bannerItem: {
        width: width - 40,
        height: 160,
        marginRight: 15,
    },
    bannerCard: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        padding: 20,
        justifyContent: 'flex-end',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    bannerBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)', // Overlay tint
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    patternOverlay: {
        flex: 1,
        opacity: 0.2,
        backgroundColor: '#000',
    },
    bannerContent: {
        zIndex: 2,
    },
    bannerDetails: {
        flex: 1,
    },
    bannerBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 8,
        backdropFilter: 'blur(10px)',
    },
    bannerBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    bannerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    bannerFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    bannerCode: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    bannerCodeText: {
        color: '#111827',
        fontSize: 11,
        fontWeight: '700',
    },
    bannerExpiry: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 11,
        fontWeight: '500',
    },
    bannerEditBtn: {
        position: 'absolute',
        top: 15,
        right: 15,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    emptyBannerContainer: {
        height: 120,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyBannerContent: {
        alignItems: 'center',
        gap: 8,
    },
    emptyBannerText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    emptyBannerSubText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    listHeaderContainer: {
        marginBottom: 15,
        marginTop: 5,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    handleBarContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: '#D1D5DB',
        borderRadius: 2,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 10,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tabBtnActive: {
        backgroundColor: '#059669',
        borderColor: '#059669',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    formContainer: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1F2937',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    colorPicker: {
        flexDirection: 'row',
        gap: 12,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedColor: {
        borderWidth: 3,
        borderColor: '#E5E7EB',
    },
    modalFooter: {
        padding: 20,
        paddingTop: 15,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    submitBtn: {
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    promoDiscount: {
        fontSize: 12,
        fontWeight: '700',
        color: '#059669',
        marginTop: 2,
    },
    discountTypeContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    typeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    typeBtnActive: {
        backgroundColor: '#059669',
        borderColor: '#059669',
    },
    typeBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    typeBtnTextActive: {
        color: '#FFFFFF',
    },
    promoMinPurchase: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 2,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 6,
    },
    heroBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    heroToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 8,
    },
    heroToggleCircle: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 1.5,
        borderColor: '#9CA3AF',
    },
    heroToggleText: {
        fontSize: 13,
        color: '#4B5563',
    },
    subLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 6,
    },
    inputMini: {
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        padding: 10,
        fontSize: 13,
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    // New Styles for cleaner layout
    bannerSettingsContainer: {
        marginBottom: 20,
        backgroundColor: '#F9FAFB',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    sectionHeaderTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 15
    },
    sectionDivider: {
        marginTop: 10,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 5
    },
    sectionDividerText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#9CA3AF'
    },
    rowContainer: {
        flexDirection: 'row',
        marginBottom: 20
    },
    discountRow: {
        flexDirection: 'row',
        gap: 10
    },
    // Custom Alert Styles
    alertContent: {
        backgroundColor: '#FFFFFF',
        width: '80%',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    alertIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEE2E2', // Red 100
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    alertMessage: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    alertActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    alertBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertBtnCancel: {
        backgroundColor: '#F3F4F6',
    },
    alertBtnDelete: {
        backgroundColor: '#EF4444',
    },
    alertBtnTextCancel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4B5563',
    },
    alertBtnTextDelete: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    }
});

export default React.memo(PromoManagement);
