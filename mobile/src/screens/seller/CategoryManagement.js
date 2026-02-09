import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Platform,
    Alert,
    Modal,
    ScrollView,
    RefreshControl,
    Dimensions,
    StatusBar,
    Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
    ChevronLeft,
    Plus,
    Trash2,
    X,
    Check,
    Edit,
    Tag,
    Layers,
    Eye,
    EyeOff,
    Image as ImageIcon,
    Upload,
    Utensils,
    Fish,
    Coffee,
    Drumstick,
    CupSoda,
    Soup,
    Cookie,
    MoreHorizontal
} from 'lucide-react-native';
import apiService, { API_URL } from '../../api/apiService';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';

const { width } = Dimensions.get('window');

const CategoryManagement = ({ navigation }) => {
    const { confirm } = useConfirm();
    const { showToast } = useToast();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [categoryName, setCategoryName] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentIcon, setCurrentIcon] = useState(null);

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

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await apiService.get('/api/categories');
            setCategories(res.data.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            showToast('Gagal memuat data kategori', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setCategoryName(item.name || '');
            setCurrentIcon(item.icon); // Store current icon path
        } else {
            setEditingItem(null);
            setCategoryName('');
            setCurrentIcon(null);
        }
        setSelectedImage(null); // Reset selected image
        setIsModalOpen(true);
    };

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!categoryName.trim()) {
            Alert.alert('Error', 'Nama kategori wajib diisi');
            return;
        }

        setIsSaving(true);
        try {
            const url = editingItem
                ? `/api/categories/${editingItem.id}`
                : `/api/categories`;
            const method = editingItem ? 'put' : 'post';

            const formData = new FormData();
            formData.append('name', categoryName.trim());

            if (selectedImage) {
                const filename = selectedImage.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                formData.append('icon', {
                    uri: Platform.OS === 'android' ? selectedImage : selectedImage.replace('file://', ''),
                    name: filename,
                    type,
                });
            }

            const response = await apiService[method](url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200 || response.status === 201) {
                showToast(editingItem ? 'Kategori diperbarui' : 'Kategori ditambahkan', 'success');
                setIsModalOpen(false);
                fetchData();
            }
        } catch (error) {
            console.error('Error saving category:', error);
            showToast(error.response?.data?.error || 'Gagal menyimpan kategori', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const accepted = await confirm({
            title: 'Hapus Kategori',
            message: 'Apakah Anda yakin ingin menghapus kategori ini? Pastikan tidak ada menu yang menggunakan kategori ini.',
            confirmText: 'Ya, Hapus',
            type: 'danger'
        });

        if (accepted) {
            try {
                await apiService.delete(`/api/categories/${id}`);
                showToast('Kategori berhasil dihapus', 'success');
                fetchData();
            } catch (error) {
                console.error('Error deleting category:', error);
                showToast(error.response?.data?.error || 'Gagal menghapus kategori. Pastikan kategori tidak sedang digunakan.', 'error');
            }
        }
    };

    const handleToggleVisibility = async (item) => {
        // Toggle optimistic
        const newStatus = !item.is_visible;
        // Optimization: update local state immediately if needed, but here let's just wait api
        // Actually for better UX, local update is good.
        setCategories(prev => prev.map(c => c.id === item.id ? { ...c, is_visible: newStatus } : c));

        try {
            const formData = new FormData();
            formData.append('name', item.name);
            formData.append('is_visible', newStatus);

            await apiService.put(`/api/categories/${item.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast('Status visibilitas diperbarui', 'success');
        } catch (error) {
            console.error('Error toggling visibility:', error);
            showToast('Gagal mengubah status', 'error');
            // Revert
            setCategories(prev => prev.map(c => c.id === item.id ? { ...c, is_visible: !newStatus } : c));
        }
    };

    const renderCategory = ({ item }) => {
        const IconComponent = getCategoryIcon(item.name);
        return (
            <View style={styles.card}>
                <View style={styles.cardInfo}>
                    <View style={styles.iconCircle}>
                        {item.icon ? (
                            <Image
                                source={{ uri: `${API_URL}${item.icon}` }}
                                style={{ width: 24, height: 24, resizeMode: 'contain' }}
                            />
                        ) : (
                            <IconComponent size={18} color="#138FEA" />
                        )}
                    </View>
                    <View>
                        <Text style={styles.nameText}>{item.name}</Text>
                        <Text style={[styles.idText, item.is_visible === 0 && { color: '#EF4444', fontWeight: 'bold' }]}>
                            {item.is_visible !== 0 ? `ID: ${item.id}` : 'Disembunyikan'}
                        </Text>
                    </View>
                </View>
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        onPress={() => handleToggleVisibility(item)}
                        style={[styles.actionBtn, { backgroundColor: item.is_visible !== 0 ? '#F0FDF4' : '#FEF2F2' }]}
                    >
                        {item.is_visible !== 0 ? (
                            <Eye size={18} color="#059669" />
                        ) : (
                            <EyeOff size={18} color="#EF4444" />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleOpenModal(item)}
                        style={styles.actionBtn}
                    >
                        <Edit size={18} color="#64748B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        style={[styles.actionBtn, styles.deleteBtn]}
                    >
                        <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manajemen Kategori</Text>
                <TouchableOpacity onPress={() => handleOpenModal()} style={styles.headerAdd}>
                    <Plus size={24} color="#1E293B" />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingArea}>
                    <ActivityIndicator size="large" color="#138FEA" />
                </View>
            ) : (
                <FlatList
                    data={categories}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    renderItem={renderCategory}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#138FEA']}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyArea}>
                            <Layers size={60} color="#E2E8F0" />
                            <Text style={styles.emptyText}>Belum ada kategori</Text>
                        </View>
                    }
                />
            )}

            <Modal
                visible={isModalOpen}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingItem ? 'Edit' : 'Tambah'} Kategori</Text>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                                <X size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={styles.label}>NAMA KATEGORI</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Contoh: Makanan Berat"
                                value={categoryName}
                                onChangeText={setCategoryName}
                            />

                            <Text style={[styles.label, { marginTop: 20 }]}>IKON KATEGORI</Text>
                            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                                {selectedImage ? (
                                    <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                                ) : currentIcon ? (
                                    <View style={styles.imagePlaceholder}>
                                        <Image source={{ uri: `${API_URL}${currentIcon}` }} style={styles.previewImage} />
                                        <View style={styles.changeOverlay}>
                                            <Edit size={16} color="#FFF" />
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <Upload size={24} color="#94A3B8" />
                                        <Text style={styles.uploadText}>Pilih Ikon</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

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
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : (Platform.OS === 'web' ? 15 : 20),
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
    loadingArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
    },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' },
            android: { elevation: 2 }
        })
    },
    cardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    idText: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteBtn: {
        backgroundColor: '#FEF2F2',
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
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        overflow: 'hidden',
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
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    modalBody: {
        padding: 24,
    },
    label: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 14,
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    modalFooter: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 35 : 25,
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
        zIndex: 999,
        elevation: 20,
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
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
    },
    saveBtn: {
        flex: 1.5,
        flexDirection: 'row',
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#138FEA',
        borderRadius: 14,
        gap: 8,
    },
    saveBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    imagePicker: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 120,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        overflow: 'hidden'
    },
    imagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%'
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain'
    },
    uploadText: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 8,
        fontWeight: 'bold'
    },
    changeOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 4,
        borderTopLeftRadius: 8
    }
});

export default CategoryManagement;
