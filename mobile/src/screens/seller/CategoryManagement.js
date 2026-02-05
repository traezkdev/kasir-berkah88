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
    StatusBar
} from 'react-native';
import {
    ChevronLeft,
    Plus,
    Trash2,
    X,
    Check,
    Edit,
    Tag,
    Layers
} from 'lucide-react-native';
import apiService from '../../api/apiService';
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
        } else {
            setEditingItem(null);
            setCategoryName('');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!categoryName.trim()) {
            Alert.alert('Error', 'Nama kategori wajib diisi');
            return;
        }

        setIsSaving(true);
        try {
            const payload = { name: categoryName.trim() };

            const url = editingItem
                ? `/api/categories/${editingItem.id}`
                : `/api/categories`;
            const method = editingItem ? 'put' : 'post';

            const response = await apiService[method](url, payload);

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

    const renderCategory = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardInfo}>
                <View style={styles.iconCircle}>
                    <Tag size={18} color="#138FEA" />
                </View>
                <View>
                    <Text style={styles.nameText}>{item.name}</Text>
                    <Text style={styles.idText}>ID: {item.id}</Text>
                </View>
            </View>
            <View style={styles.cardActions}>
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
                                autoFocus={true}
                            />
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
    }
});

export default CategoryManagement;
