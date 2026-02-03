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
    Alert,
    Modal,
    ScrollView,
    Switch,
    RefreshControl
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
    Camera
} from 'lucide-react-native';
import apiService, { API_URL } from '../../api/apiService';

const MenuManagement = ({ navigation }) => {
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
        description: ''
    });

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
            console.error('Error fetching menu data:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                price: item.price.toString(),
                stock: item.stock.toString(),
                category: item.category,
                hpp: (item.hpp || '0').toString(),
                discount: (item.discount || '0').toString(),
                is_featured: item.is_featured === 1 || item.is_featured === true,
                description: item.description || ''
            });
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
                description: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        // Validasi input
        if (!formData.name || !formData.price || formData.stock === '') {
            Alert.alert('Error', 'Mohon isi nama, harga, dan stok');
            return;
        }

        setIsSaving(true);
        const priceNum = parseFloat(formData.price);
        const stockNum = parseInt(formData.stock);
        const hppNum = parseFloat(formData.hpp || 0);
        const discNum = parseFloat(formData.discount || 0);

        if (isNaN(priceNum) || isNaN(stockNum)) {
            Alert.alert('Error', 'Harga dan Stok harus berupa angka yang valid');
            setIsSaving(false);
            return;
        }

        try {
            const dataToSubmit = {
                ...formData,
                id: editingItem ? editingItem.id : `M-${Date.now()}`,
                price: priceNum,
                stock: stockNum,
                hpp: hppNum,
                discount: discNum,
                is_featured: formData.is_featured ? 1 : 0
            };

            const url = editingItem
                ? `/api/menu-items/${editingItem.id}`
                : `/api/menu-items`;
            const method = editingItem ? 'put' : 'post';

            const response = await apiService[method](url, dataToSubmit);

            if (response.status === 200 || response.status === 201) {
                Alert.alert('Sukses', editingItem ? 'Menu diperbarui' : 'Menu ditambahkan');
                setIsModalOpen(false);
                fetchData();
            }
        } catch (error) {
            console.error('Error saving menu:', error);
            Alert.alert('Error', 'Gagal menyimpan menu');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Hapus Menu',
            'Apakah Anda yakin ingin menghapus menu ini?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiService.delete(`/api/menu-items/${id}`);
                            fetchData();
                        } catch (error) {
                            Alert.alert('Eror', 'Gagal menghapus menu');
                        }
                    }
                }
            ]
        );
    };

    const filteredItems = menuItems.filter(item => {
        const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const renderItem = ({ item }) => (
        <View style={styles.menuCard}>
            {item.is_featured === 1 && (
                <View style={styles.featuredBadge}>
                    <Text style={styles.featuredText}>FEATURED</Text>
                </View>
            )}
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
                    onPress={() => handleOpenModal(item)}
                    style={styles.editBtn}
                >
                    <Settings size={18} color="#64748B" />
                    <Text style={styles.editBtnText}>Atur Menu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={styles.deleteBtn}
                >
                    <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
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
                    data={['Semua', ...categories.map(c => c.name)]}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.catList}
                    contentContainerStyle={styles.catListContent}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setActiveCategory(item)}
                            style={[styles.catBtn, activeCategory === item && styles.activeCatBtn]}
                        >
                            <Text style={[styles.catBtnText, activeCategory === item && styles.activeCatBtnText]}>{item}</Text>
                        </TouchableOpacity>
                    )}
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

            {/* Modal Form */}
            <Modal
                visible={isModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>{editingItem ? 'Edit' : 'Tambah'} Menu</Text>
                                <Text style={styles.modalSubtitle}>INFORMASI PRODUK</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeModalBtn}>
                                <X size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            {/* Placeholder for Image Upload */}
                            <View style={styles.imageUploadArea}>
                                <TouchableOpacity style={styles.imageCircle}>
                                    <View style={styles.imagePlaceholder}>
                                        <Camera size={32} color="#CBD5E1" />
                                        <Text style={styles.imagePlaceholderText}>FOTO MENU</Text>
                                    </View>
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
                                        {categories.map(cat => (
                                            <TouchableOpacity
                                                key={cat.id}
                                                onPress={() => setFormData({ ...formData, category: cat.name })}
                                                style={[styles.catPickBtn, formData.category === cat.name && styles.activeCatPickBtn]}
                                            >
                                                <Text style={[styles.catPickText, formData.category === cat.name && styles.activeCatPickText]}>{cat.name}</Text>
                                            </TouchableOpacity>
                                        ))}
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
                        </ScrollView>

                        <View style={styles.modalFooter}>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
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
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' },
            android: { elevation: 2 }
        })
    },
    featuredBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#F97316',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        zIndex: 1,
    },
    featuredText: {
        color: '#FFFFFF',
        fontSize: 8,
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
        backgroundColor: '#F8FAFC',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    editBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#64748B',
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '92%',
        display: 'flex',
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
        marginTop: 4,
    },
    closeModalBtn: {
        padding: 8,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
    },
    modalBody: {
        flex: 1,
        padding: 24,
    },
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
        backgroundColor: '#EFF6FF',
        borderColor: '#2563EB',
    },
    catPickText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
    },
    activeCatPickText: {
        color: '#2563EB',
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
    modalFooter: {
        flexDirection: 'row',
        padding: 24,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
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
        shadowColor: '#1E40AF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
    }
});

export default MenuManagement;
