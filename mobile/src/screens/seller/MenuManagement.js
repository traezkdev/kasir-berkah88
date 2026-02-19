import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    TextInput,
    Platform,
    Modal,
    ScrollView,
    Switch,
    RefreshControl,
    StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
    ChevronLeft,
    Search,
    Plus,
    Settings,
    Trash2,
    Star,
    Image as ImageIcon,
    X,
    Check,
    Camera,
    Utensils,
    Fish,
    Coffee,
    Tag,
    MoreHorizontal,
    Drumstick,
    CupSoda,
    Soup,
    Cookie,
    LayoutGrid,
    Eye,
    EyeOff
} from 'lucide-react-native';
import apiService, { API_URL } from '../../api/apiService';
import * as ImagePicker from 'expo-image-picker';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import BottomModalTemplate from '../../components/templates/BottomModalTemplate';

const MenuManagement = ({ navigation }) => {
    const { confirm } = useConfirm();
    const { showToast } = useToast();
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Semua');

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '',
        category: '',
        hpp: '',
        discount: 0,
        is_featured: false,
        is_hidden: false,
        description: ''
    });
    const [imageUri, setImageUri] = useState(null);

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

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [menuRes, catRes] = await Promise.all([
                apiService.get('/api/menu-items/all'),
                apiService.get('/api/categories')
            ]);
            setMenuItems(menuRes.data.data || []);
            setCategories(catRes.data.data || []);
        } catch (error) {
            console.error('Error fetching menu data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const handleOpenModal = useCallback((item = null) => {
        if (item) {
            setEditingItem(item);
            const currentCategory = (item.category || '').trim();
            setFormData({
                name: item.name,
                price: item.price.toString(),
                stock: item.stock.toString(),
                category: currentCategory || (categories.length > 0 ? categories[0].name : 'Lainnya'),
                hpp: (item.hpp || '0').toString(),
                discount: (item.discount || '0').toString(),
                is_featured: item.is_featured === 1 || item.is_featured === true,
                is_hidden: item.is_hidden === 1 || item.is_hidden === true,
                description: item.description || ''
            });
            setImageUri(item.image_url ? `${API_URL}${item.image_url}` : null);
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                price: '',
                stock: '',
                category: categories[0]?.name || 'Lainnya',
                hpp: '',
                discount: 0,
                is_featured: false,
                is_hidden: false,
                description: ''
            });
            setImageUri(null);
        }
        setIsModalOpen(true);
    }, [categories]);

    // Sinkronisasi kategori saat daftar kategori dari backend tersedia
    useEffect(() => {
        if (isModalOpen && !formData.category && categories.length > 0) {
            setFormData(prev => ({ ...prev, category: categories[0].name }));
        }
    }, [isModalOpen, categories, formData.category]);

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                showToast('Mohon izinkan akses galeri untuk memilih foto.', 'error');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                setImageUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            showToast('Terjadi kesalahan saat memilih gambar.', 'error');
        }
    };

    const handleSubmit = async () => {
        // Validasi input
        if (!formData.name || !formData.price || formData.stock === '') {
            showToast('Mohon isi nama, harga, dan stok', 'info');
            return;
        }

        setIsSaving(true);
        const priceNum = parseFloat(formData.price);
        const stockNum = parseInt(formData.stock);
        const hppNum = parseFloat(formData.hpp || 0);
        const discNum = parseFloat(formData.discount || 0);

        if (isNaN(priceNum) || isNaN(stockNum)) {
            showToast('Harga dan Stok harus berupa angka yang valid', 'error');
            setIsSaving(false);
            return;
        }

        try {
            const formDataToSend = new FormData();

            // Append form fields
            formDataToSend.append('name', formData.name);
            formDataToSend.append('price', priceNum);
            formDataToSend.append('stock', stockNum);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('hpp', hppNum);
            formDataToSend.append('discount', discNum);
            formDataToSend.append('is_featured', formData.is_featured ? 1 : 0);
            formDataToSend.append('is_hidden', formData.is_hidden ? 1 : 0);
            formDataToSend.append('description', formData.description || '');

            // Append image if selected and it's a new image (not from server)
            if (imageUri && !imageUri.startsWith('http')) {
                if (Platform.OS === 'web') {
                    try {
                        const responseBlob = await fetch(imageUri);
                        const blob = await responseBlob.blob();
                        formDataToSend.append('image', blob, 'menu_image.jpg');
                    } catch (error) {
                        console.error('Error converting image to blob for web:', error);
                    }
                } else {
                    const filename = imageUri.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : 'image/jpeg';

                    formDataToSend.append('image', {
                        uri: imageUri,
                        name: filename,
                        type
                    });
                }
            }

            const url = editingItem
                ? `/api/menu-items/${editingItem.id}`
                : `/api/menu-items`;
            const method = editingItem ? 'put' : 'post';

            const response = await apiService[method](url, formDataToSend, {
                headers: {
                    'Content-Type': Platform.OS === 'web' ? undefined : 'multipart/form-data'
                }
            });

            if (response.status === 200 || response.status === 201) {
                showToast(editingItem ? 'Menu diperbarui' : 'Menu ditambahkan', 'success');
                setIsModalOpen(false);
                fetchData();
            }
        } catch (error) {
            console.error('Error saving menu:', error);
            showToast('Gagal menyimpan menu', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = useCallback(async (id) => {
        const accepted = await confirm({
            title: 'Hapus Menu',
            message: 'Apakah Anda yakin ingin menghapus menu ini? Tindakan ini tidak dapat dibatalkan.',
            confirmText: 'Ya, Hapus',
            type: 'danger'
        });

        if (accepted) {
            try {
                const response = await apiService.delete(`/api/menu-items/${id}`);
                if (response.status === 200 || response.status === 204) {
                    showToast('Menu berhasil dihapus', 'success');
                    fetchData();
                } else {
                    showToast('Gagal menghapus menu', 'error');
                }
            } catch (error) {
                console.error('Error deleting menu:', error);
                const errorMsg = error.response?.data?.error || 'Gagal menghapus menu. Pastikan Anda memiliki menu tersebut atau coba lagi.';
                showToast(errorMsg, 'error');
            }
        }
    }, [confirm, fetchData]);

    const handleToggleVisibility = useCallback(async (item) => {
        try {
            const newStatus = !item.is_hidden;
            // Optimistic update
            setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, is_hidden: newStatus } : i));

            await apiService.put(`/api/menu-items/${item.id}`, {
                is_hidden: newStatus ? 1 : 0
            });
            // No need to fetch data again if optimistic update works, but to be safe:
            // fetchData(); 
        } catch (error) {
            console.error('Error toggling visibility:', error);
            showToast('Gagal mengubah status visibilitas', 'error');
            // Revert on error
            setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, is_hidden: item.is_hidden } : i));
        }
    }, []);

    const filteredItems = menuItems.filter(item => {
        const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const renderItem = useCallback(({ item }) => (
        <MenuItem
            item={item}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
            onToggleVisibility={handleToggleVisibility}
        />
    ), [handleOpenModal, handleDelete, handleToggleVisibility]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Katalog Menu</Text>
                <TouchableOpacity onPress={() => handleOpenModal()} style={styles.headerAdd}>
                    <Plus size={24} color="#1E293B" />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Search size={20} color="#94A3B8" />
                    <TextInput
                        placeholder="Cari menu..."
                        style={styles.searchInput}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>

                <FlatList
                    data={[{ id: 'all', name: 'Semua' }, ...categories]}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.catList}
                    contentContainerStyle={styles.catListContent}
                    renderItem={({ item }) => {
                        const isActive = activeCategory === item.name;
                        const IconComponent = item.id === 'all' ? LayoutGrid : getCategoryIcon(item.name);
                        return (
                            <TouchableOpacity
                                onPress={() => setActiveCategory(item.name)}
                                style={[styles.catBtn, isActive && styles.activeCatBtn]}
                            >
                                {item.icon ? (
                                    <Image
                                        source={{ uri: `${API_URL}${item.icon}` }}
                                        style={{ width: 14, height: 14, marginRight: 6, resizeMode: 'contain' }}
                                    />
                                ) : (
                                    <IconComponent size={14} color={isActive ? "#FFFFFF" : "#64748B"} style={{ marginRight: 6 }} />
                                )}
                                <Text style={[styles.catBtnText, isActive && styles.activeCatBtnText]}>{item.name}</Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingArea}>
                    <ActivityIndicator size="large" color="#138FEA" />
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.menuList}
                    renderItem={renderItem}
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={fetchData}
                            colors={['#138FEA']}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyArea}>
                            <ImageIcon size={60} color="#E2E8F0" />
                            <Text style={styles.emptyText}>Menu tidak ditemukan</Text>
                        </View>
                    }
                />
            )}

            <BottomModalTemplate
                visible={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? 'Edit Menu' : 'Tambah Menu'}
                footer={
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.cancelBtn}>
                            <Text style={styles.cancelBtnText}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={isSaving}
                            style={styles.saveBtn}
                        >
                            <Text style={styles.saveBtnText}>{isSaving ? 'Menyimpan...' : 'Simpan'}</Text>
                            {!isSaving && <Check size={20} color="#FFFFFF" />}
                        </TouchableOpacity>
                    </View>
                }
            >
                {/* Image Upload */}
                <View style={styles.imageUploadArea}>
                    <TouchableOpacity style={styles.imageCircle} onPress={pickImage}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Camera size={32} color="#CBD5E1" />
                                <Text style={styles.imagePlaceholderText}>FOTO MENU</Text>
                            </View>
                        )}
                        <View style={styles.cameraIconBadge}>
                            <Plus size={16} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>NAMA MENU</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Contoh: Kopi Susu"
                        value={formData.name}
                        onChangeText={(val) => setFormData({ ...formData, name: val })}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>HARGA JUAL</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="15000"
                            keyboardType="numeric"
                            value={formData.price}
                            onChangeText={(val) => setFormData({ ...formData, price: val })}
                        />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>STOK</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="100"
                            keyboardType="numeric"
                            value={formData.stock}
                            onChangeText={(val) => setFormData({ ...formData, stock: val })}
                        />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>KATEGORI</Text>
                    <View style={styles.categoryPicker}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                            {categories.map(cat => {
                                const isActive = (formData.category || '').trim().toLowerCase() === (cat.name || '').trim().toLowerCase();
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        onPress={() => setFormData({ ...formData, category: cat.name })}
                                        style={[styles.catPickBtn, isActive && styles.activeCatPickBtn]}
                                    >
                                        <Text style={[styles.catPickText, isActive && styles.activeCatPickText]}>{(cat.name || '').trim()}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                            {/* Jika kategori item tidak ada di list utama (case-insensitive), tetap tampilkan sebagai terpilih agar tidak hilang */}
                            {formData.category && !categories.find(c => (c.name || '').trim().toLowerCase() === (formData.category || '').trim().toLowerCase()) && (
                                <TouchableOpacity
                                    onPress={() => { }}
                                    style={[styles.catPickBtn, styles.activeCatPickBtn]}
                                >
                                    <Text style={[styles.catPickText, styles.activeCatPickText]}>{formData.category.trim()}</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>DESKRIPSI (OPSIONAL)</Text>
                    <TextInput
                        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                        placeholder="Jelaskan detail menu..."
                        multiline
                        value={formData.description}
                        onChangeText={(val) => setFormData({ ...formData, description: val })}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>MODAL (HPP)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="8000"
                            keyboardType="numeric"
                            value={formData.hpp}
                            onChangeText={(val) => setFormData({ ...formData, hpp: val })}
                        />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>DISKON (%)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            keyboardType="numeric"
                            value={formData.discount.toString()}
                            onChangeText={(val) => setFormData({ ...formData, discount: val })}
                        />
                    </View>
                </View>

                <View style={styles.featuredToggle}>
                    <View>
                        <Text style={styles.toggleTitle}>Menu Unggulan</Text>
                        <Text style={styles.toggleSubtitle}>Tampilkan di halaman favorit</Text>
                    </View>
                    <Switch
                        value={formData.is_featured}
                        onValueChange={(val) => setFormData({ ...formData, is_featured: val })}
                        trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                        thumbColor={formData.is_featured ? '#2563EB' : '#94A3B8'}
                    />
                </View>

                <View style={[styles.featuredToggle, { marginBottom: 40, backgroundColor: '#FFF1F2', borderColor: '#FFE4E6' }]}>
                    <View>
                        <Text style={[styles.toggleTitle, { color: '#BE123C' }]}>Sembunyikan Menu</Text>
                        <Text style={[styles.toggleSubtitle, { color: '#9F1239' }]}>Jangan tampilkan di aplikasi pelanggan</Text>
                    </View>
                    <Switch
                        value={formData.is_hidden}
                        onValueChange={(val) => setFormData({ ...formData, is_hidden: val })}
                        trackColor={{ false: '#E2E8F0', true: '#FECDD3' }}
                        thumbColor={formData.is_hidden ? '#E11D48' : '#94A3B8'}
                    />
                </View>
            </BottomModalTemplate>
        </View >
    );
};

const MenuItem = React.memo(({ item, onEdit, onDelete, onToggleVisibility }) => {
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    return (
        <View style={styles.menuCard}>
            <View style={styles.badgesContainer}>
                {item.is_featured === 1 && (
                    <View style={styles.featuredBadge}>
                        <Text style={styles.featuredText}>FEATURED</Text>
                    </View>
                )}
                {item.discount > 0 && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>Hemat {parseFloat(item.discount)}%</Text>
                    </View>
                )}
                {(item.is_hidden === 1 || item.is_hidden === true) && (
                    <View style={[styles.discountBadge, { backgroundColor: '#64748B' }]}>
                        <EyeOff size={8} color="#FFFFFF" style={{ marginRight: 2 }} />
                        <Text style={styles.discountText}>HIDDEN</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardTop}>
                <View style={styles.imageContainer}>
                    {item.image_url ? (
                        <Image
                            source={{ uri: `${API_URL}${item.image_url}` }}
                            style={styles.menuImage}
                        />
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <ImageIcon size={30} color="#CBD5E1" />
                        </View>
                    )}
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.catText}>{item.category}</Text>
                    <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.priceText}>{formatCurrency(item.price)}</Text>

                    <View style={styles.stockRow}>
                        <View style={[styles.stockDot, { backgroundColor: item.stock > 0 ? '#22C55E' : '#EF4444' }]} />
                        <Text style={styles.stockText}>Stok: {item.stock}</Text>
                        {item.total_reviews > 0 && (
                            <View style={styles.ratingRow}>
                                <Star size={10} color="#FBBF24" fill="#FBBF24" />
                                <Text style={styles.ratingText}>{parseFloat(item.average_rating).toFixed(1)}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity
                    onPress={() => onEdit(item)}
                    style={styles.editBtn}
                >
                    <Settings size={18} color="#2563EB" />
                    <Text style={styles.editBtnText}>Atur Menu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => onToggleVisibility(item)}
                    style={[styles.deleteBtn, { backgroundColor: item.is_hidden ? '#F0FDF4' : '#F1F5F9' }]}
                >
                    {item.is_hidden ? (
                        <EyeOff size={18} color="#16A34A" />
                    ) : (
                        <Eye size={18} color="#64748B" />
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => onDelete(item.id)}
                    style={styles.deleteBtn}
                >
                    <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        width: '100%',
        height: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : (Platform.OS === 'web' ? 10 : 15),
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
    },
    backBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    headerAdd: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchSection: {
        backgroundColor: '#FFFFFF',
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        marginHorizontal: 20,
        paddingHorizontal: 16,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 15,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    catList: {
        maxHeight: 40,
    },
    catListContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    catBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    activeCatBtn: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    catBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
    },
    activeCatBtnText: {
        color: '#FFFFFF',
    },
    loadingArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuList: {
        padding: 20,
    },
    menuCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    badgesContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1,
        alignItems: 'flex-end',
        gap: 6,
    },
    featuredBadge: {
        backgroundColor: '#F97316',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    featuredText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: '900',
    },
    discountBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
    },
    cardTop: {
        flexDirection: 'row',
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
    },
    menuImage: {
        width: '100%',
        height: '100%',
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardInfo: {
        flex: 1,
        marginLeft: 16,
    },
    catText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#2563EB',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    nameText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
        marginTop: 2,
    },
    priceText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#2563EB',
        marginTop: 4,
    },
    stockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    stockDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    stockText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748B',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#B45309',
        marginLeft: 4,
    },
    cardActions: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderColor: '#F8FAFC',
        flexDirection: 'row',
        gap: 10,
    },
    editBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EFF6FF',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    editBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    deleteBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    // Form Styles restored
    imageUploadArea: {
        alignItems: 'center',
        marginBottom: 30,
    },
    imageCircle: {
        width: 100,
        height: 100,
        borderRadius: 25,
        backgroundColor: '#F8FAFC',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    imagePlaceholder: {
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#CBD5E1',
        marginTop: 4,
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        borderRadius: 23,
    },
    cameraIconBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: '#2563EB',
        width: 30,
        height: 30,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    row: {
        flexDirection: 'row',
        gap: 15,
    },
    categoryPicker: {
        marginTop: 4,
    },
    catPickBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    activeCatPickBtn: {
        backgroundColor: '#1E40AF',
        borderColor: '#1E40AF',
    },
    catPickText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
    },
    activeCatPickText: {
        color: '#FFFFFF',
    },
    featuredToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
        padding: 16,
        borderRadius: 20,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: '#E0F2FE',
    },
    toggleTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#075985',
    },
    toggleSubtitle: {
        fontSize: 11,
        color: '#0369A1',
        fontWeight: 'bold',
    },

    cancelBtn: {
        flex: 1,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 18,
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
    },
    saveBtn: {
        flex: 2,
        height: 56,
        backgroundColor: '#1E40AF',
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#1E40AF',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: { elevation: 4 },
            web: { boxShadow: '0px 4px 8px rgba(30, 64, 175, 0.2)' }
        })
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
    }
});

export default MenuManagement;
