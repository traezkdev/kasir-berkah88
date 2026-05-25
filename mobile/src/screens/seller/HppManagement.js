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
    StatusBar,
    RefreshControl,
    Modal,
    ScrollView
} from 'react-native';
import {
    ChevronLeft,
    Search,
    Save,
    TrendingUp,
    DollarSign,
    Filter,
    Package,
    Plus,
    Trash2,
    X,
    Edit2,
    PlusCircle,
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import { useToast } from '../../context/ToastContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HppManagement = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();
    const [menuItems, setMenuItems] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [newIngredient, setNewIngredient] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all'); // all, profit, loss, low_stock
    
    // Dropdown picker modal states
    const [pickerVisible, setPickerVisible] = useState(false);
    const [activeEditItemId, setActiveEditItemId] = useState(null);
    const [activeComponentIndex, setActiveComponentIndex] = useState(null);

    // Fetch master bahan
    const fetchIngredients = async () => {
        try {
            const response = await apiService.get('/api/hpp-ingredients');
            if (response.data.message === 'success') {
                setIngredients(response.data.data || []);
            }
        } catch (error) {
            console.error('Fetch ingredients error:', error);
        }
    };

    // Tambah master bahan baru
    const handleAddIngredient = async () => {
        if (!newIngredient.trim()) return;
        try {
            const response = await apiService.post('/api/hpp-ingredients', { name: newIngredient.trim() });
            if (response.status === 200 || response.status === 201) {
                showToast('Bahan berhasil ditambahkan', 'success');
                setNewIngredient('');
                fetchIngredients();
            } else {
                showToast(response.data.message || 'Gagal menambahkan bahan', 'error');
            }
        } catch (error) {
            showToast('Gagal menambahkan bahan', 'error');
        }
    };

    // Hapus master bahan
    const handleDeleteIngredient = async (id) => {
        Alert.alert(
            'Konfirmasi',
            'Yakin ingin menghapus bahan ini?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await apiService.delete(`/api/hpp-ingredients/${id}`);
                            if (response.status === 200) {
                                showToast('Bahan berhasil dihapus', 'success');
                                fetchIngredients();
                            } else {
                                showToast('Gagal menghapus bahan', 'error');
                            }
                        } catch (error) {
                            showToast('Gagal menghapus bahan', 'error');
                        }
                    }
                }
            ]
        );
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiService.get('/api/menu-items/all');
            if (response.data.message === 'success' && Array.isArray(response.data.data)) {
                const initializedItems = response.data.data.map(item => ({
                    ...item,
                    isEditing: false,
                    draftComponents: Array.isArray(item.hpp_details) && item.hpp_details.length > 0
                        ? item.hpp_details.map(c => ({ ...c }))
                        : [{ name: '', cost: '' }],
                }));
                setMenuItems(initializedItems);
            } else {
                showToast('Gagal memuat data menu', 'error');
            }
        } catch (error) {
            console.error('Error fetching menu data:', error);
            showToast('Gagal memuat data menu', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchData();
        fetchIngredients();
    }, [fetchData]);

    const handleEdit = (itemId) => {
        setMenuItems(prev =>
            prev.map(item =>
                item.id == itemId
                    ? {
                        ...item,
                        isEditing: true,
                        draftComponents: Array.isArray(item.hpp_details) && item.hpp_details.length > 0
                            ? item.hpp_details.map(c => ({ ...c }))
                            : [{ name: '', cost: '' }],
                    }
                    : { ...item, isEditing: false }
            )
        );
    };

    const handleCancel = (itemId) => {
        setMenuItems(prev =>
            prev.map(item =>
                item.id == itemId ? { ...item, isEditing: false } : item
            )
        );
    };

    const handleComponentChange = (itemId, index, field, value) => {
        setMenuItems(prev =>
            prev.map(item => {
                if (item.id != itemId) return item;
                const newComps = item.draftComponents.map((c, i) =>
                    i === index ? { ...c, [field]: value } : c
                );
                return { ...item, draftComponents: newComps };
            })
        );
    };

    const handleAddComponent = (itemId) => {
        setMenuItems(prev =>
            prev.map(item =>
                item.id == itemId
                    ? { ...item, draftComponents: [...item.draftComponents, { name: '', cost: '' }] }
                    : item
            )
        );
    };

    const handleRemoveComponent = (itemId, index) => {
        setMenuItems(prev =>
            prev.map(item => {
                if (item.id != itemId) return item;
                const newComps = item.draftComponents.filter((_, i) => i !== index);
                return { ...item, draftComponents: newComps.length > 0 ? newComps : [{ name: '', cost: '' }] };
            })
        );
    };

    const calcTotalFromComponents = (components) =>
        components.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0);

    const handleSave = async (itemId) => {
        const itemToSave = menuItems.find(item => item.id == itemId);
        if (!itemToSave) return;

        const validComponents = itemToSave.draftComponents.filter(c => c.name.trim() !== '');
        const totalHpp = calcTotalFromComponents(validComponents);

        try {
            await apiService.put(`/api/menu-items/${itemToSave.id}`, {
                hpp: totalHpp,
                hpp_details: validComponents,
            });

            showToast('Detail HPP berhasil disimpan!', 'success');
            fetchData();
        } catch (error) {
            showToast('Gagal memperbarui HPP', 'error');
            console.error('Save HPP Error:', error);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesFilter = true;
        const totalHpp = item.isEditing
            ? calcTotalFromComponents(item.draftComponents)
            : (item.hpp || 0);
        const margin = item.price - totalHpp;

        if (selectedFilter === 'profit') {
            matchesFilter = margin > 0;
        } else if (selectedFilter === 'loss') {
            matchesFilter = margin <= 0;
        } else if (selectedFilter === 'low_stock') {
            matchesFilter = (item.stock || 0) <= 5;
        }

        return matchesSearch && matchesFilter;
    });

    const totalItems = filteredItems.length;
    const totalAssets = filteredItems.reduce((acc, item) => {
        const hpp = item.isEditing
            ? calcTotalFromComponents(item.draftComponents)
            : (item.hpp || 0);
        return acc + (hpp * item.stock);
    }, 0);

    const openIngredientPicker = (itemId, index) => {
        setActiveEditItemId(itemId);
        setActiveComponentIndex(index);
        setPickerVisible(true);
    };

    const selectIngredient = (name) => {
        if (activeEditItemId !== null && activeComponentIndex !== null) {
            handleComponentChange(activeEditItemId, activeComponentIndex, 'name', name);
        }
        setPickerVisible(false);
    };

    const renderItem = ({ item }) => {
        const totalHpp = item.isEditing
            ? calcTotalFromComponents(item.draftComponents)
            : (item.hpp || 0);
        const margin = item.price - totalHpp;
        const marginPercent = item.price > 0 ? (margin / item.price) * 100 : 0;
        const isProfit = margin >= 0;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemCategory}>{item.category}</Text>
                    </View>
                    {!item.isEditing && (
                        <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item.id)}>
                            <Edit2 size={16} color="#2563EB" />
                            <Text style={styles.editBtnText}>Edit HPP</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Harga Jual</Text>
                        <Text style={styles.value}>{formatCurrency(item.price)}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Stok</Text>
                        <Text style={styles.value}>{item.stock}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {item.isEditing ? (
                    <View style={styles.editSection}>
                        <Text style={styles.editSectionTitle}>Komponen Biaya (HPP)</Text>
                        {item.draftComponents.map((comp, index) => (
                            <View key={index} style={styles.compRow}>
                                <TouchableOpacity
                                    style={styles.pickerSelector}
                                    onPress={() => openIngredientPicker(item.id, index)}
                                >
                                    <Text style={[styles.pickerSelectorText, !comp.name && styles.pickerSelectorPlaceholder]}>
                                        {comp.name || 'Pilih Bahan'}
                                    </Text>
                                    <ChevronLeft size={16} color="#64748B" style={{ transform: [{ rotate: '-90deg' }] }} />
                                </TouchableOpacity>

                                <TextInput
                                    style={styles.compCostInput}
                                    value={comp.cost ? comp.cost.toString() : ''}
                                    onChangeText={(val) => handleComponentChange(item.id, index, 'cost', val)}
                                    keyboardType="numeric"
                                    placeholder="Biaya (Rp)"
                                />

                                <TouchableOpacity
                                    onPress={() => handleRemoveComponent(item.id, index)}
                                    style={styles.removeCompBtn}
                                >
                                    <Trash2 size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <TouchableOpacity
                            onPress={() => handleAddComponent(item.id)}
                            style={styles.addCompBtn}
                        >
                            <PlusCircle size={16} color="#2563EB" />
                            <Text style={styles.addCompText}>Tambah Komponen</Text>
                        </TouchableOpacity>

                        <View style={styles.saveCancelRow}>
                            <TouchableOpacity style={styles.saveActionBtn} onPress={() => handleSave(item.id)}>
                                <Save size={16} color="#FFF" />
                                <Text style={styles.saveActionText}>Simpan HPP</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelActionBtn} onPress={() => handleCancel(item.id)}>
                                <X size={16} color="#64748B" />
                                <Text style={styles.cancelActionText}>Batal</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.detailsSection}>
                        {Array.isArray(item.hpp_details) && item.hpp_details.length > 0 ? (
                            <View style={styles.detailsGrid}>
                                {item.hpp_details.map((comp, idx) => (
                                    <View key={idx} style={styles.detailChip}>
                                        <Text style={styles.detailChipName}>{comp.name}</Text>
                                        <Text style={styles.detailChipCost}>{formatCurrency(comp.cost)}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.emptyDetailsText}>Belum ada rincian komponen HPP.</Text>
                        )}
                    </View>
                )}

                <View style={[styles.marginBadge, isProfit ? styles.profitBg : styles.lossBg]}>
                    <Text style={[styles.marginText, isProfit ? styles.profitText : styles.lossText]}>
                        Total HPP: {formatCurrency(totalHpp)}  |  Laba: {formatCurrency(margin)} ({marginPercent.toFixed(1)}%)
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            {/* Header Area */}
            <View style={styles.headerContainer}>
                {/* Navbar */}
                <View style={[styles.navbar, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Manajemen HPP</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Filter Tabs */}
                <View style={styles.tabContainer}>
                    {[
                        { id: 'all', label: 'Semua' },
                        { id: 'profit', label: 'Untung' },
                        { id: 'loss', label: 'Rugi' },
                        { id: 'low_stock', label: 'Stok < 5' }
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tabBtn, selectedFilter === tab.id && styles.tabBtnActive]}
                            onPress={() => setSelectedFilter(tab.id)}
                        >
                            <Text style={[styles.tabText, selectedFilter === tab.id && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Content Body */}
            <View style={styles.contentBody}>
                {/* Search Bar & Master Bahan */}
                <FlatList
                    data={filteredItems}
                    extraData={menuItems}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={fetchData} colors={['#1E40AF']} />
                    }
                    ListHeaderComponent={
                        <View style={{ gap: 16, marginBottom: 10 }}>
                            {/* Search Bar */}
                            <View style={styles.searchBar}>
                                <Search size={20} color="#94A3B8" />
                                <TextInput
                                    placeholder="Cari produk..."
                                    style={styles.searchInput}
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                />
                            </View>

                            {/* Summary Grid */}
                            <View style={styles.summaryGrid}>
                                <View style={styles.summaryItem}>
                                    <View style={[styles.summaryIcon, { backgroundColor: '#EFF6FF' }]}>
                                        <Package size={20} color="#2563EB" />
                                    </View>
                                    <View>
                                        <Text style={styles.summaryLabelDark}>Total Produk</Text>
                                        <Text style={styles.summaryValueDark}>{totalItems}</Text>
                                    </View>
                                </View>
                                <View style={styles.summaryItem}>
                                    <View style={[styles.summaryIcon, { backgroundColor: '#ECFDF5' }]}>
                                        <DollarSign size={20} color="#10B981" />
                                    </View>
                                    <View>
                                        <Text style={styles.summaryLabelDark}>Total Aset</Text>
                                        <Text style={styles.summaryValueDark}>{formatCurrency(totalAssets)}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Master Daftar Bahan */}
                            <View style={styles.masterBahanCard}>
                                <Text style={styles.masterBahanTitle}>Master Daftar Bahan</Text>
                                <View style={styles.masterForm}>
                                    <TextInput
                                        style={styles.masterInput}
                                        placeholder="Nama bahan baru (contoh: Sambal)"
                                        value={newIngredient}
                                        onChangeText={setNewIngredient}
                                    />
                                    <TouchableOpacity style={styles.masterAddBtn} onPress={handleAddIngredient}>
                                        <Plus size={20} color="#FFF" />
                                    </TouchableOpacity>
                                </View>

                                {ingredients.length === 0 ? (
                                    <Text style={styles.masterBahanEmpty}>Belum ada master bahan.</Text>
                                ) : (
                                    <View style={styles.chipContainer}>
                                        {ingredients.map((ing) => (
                                            <View key={ing.id} style={styles.chip}>
                                                <Text style={styles.chipText}>{ing.name}</Text>
                                                <TouchableOpacity onPress={() => handleDeleteIngredient(ing.id)}>
                                                    <X size={14} color="#6366F1" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyArea}>
                            <Text style={styles.emptyText}>Tidak ada data produk</Text>
                        </View>
                    }
                />
            </View>

            {/* Custom Modal Picker for Ingredients Selection */}
            <Modal
                transparent={true}
                visible={pickerVisible}
                animationType="fade"
                onRequestClose={() => setPickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pilih Bahan Baku</Text>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <X size={20} color="#1E293B" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalList}>
                            {ingredients.map((ing) => (
                                <TouchableOpacity
                                    key={ing.id}
                                    style={styles.modalItem}
                                    onPress={() => selectIngredient(ing.name)}
                                >
                                    <Text style={styles.modalItemText}>{ing.name}</Text>
                                </TouchableOpacity>
                            ))}
                            {ingredients.length === 0 && (
                                <Text style={styles.modalEmpty}>Silakan tambah master bahan terlebih dahulu.</Text>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1E40AF',
    },
    headerContainer: {
        backgroundColor: '#1E40AF',
        paddingBottom: 30,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabBtnActive: {
        backgroundColor: '#FFFFFF',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#BFDBFE',
    },
    tabTextActive: {
        color: '#1E40AF',
        fontWeight: 'bold',
    },
    contentBody: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        marginTop: -25,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 10,
        overflow: 'hidden'
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    listContent: {
        padding: 20,
        gap: 16,
        paddingBottom: 40,
    },
    summaryGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    summaryItem: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    summaryIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryLabelDark: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    summaryValueDark: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
    },
    masterBahanCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    masterBahanTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 12,
    },
    masterForm: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    masterInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 13,
        fontWeight: '500',
    },
    masterAddBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#4F46E5',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    masterBahanEmpty: {
        fontSize: 12,
        color: '#64748B',
        fontStyle: 'italic',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#E0E7FF',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4F46E5',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    itemCategory: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748B',
        marginTop: 2,
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    editBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    row: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    col: {
        flex: 1,
    },
    label: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#94A3B8',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    value: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#334155',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 10,
    },
    editSection: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    editSectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748B',
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    compRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    pickerSelector: {
        flex: 1.2,
        height: 40,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pickerSelectorText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E293B',
    },
    pickerSelectorPlaceholder: {
        color: '#94A3B8',
    },
    compCostInput: {
        flex: 0.8,
        height: 40,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        paddingHorizontal: 10,
        fontSize: 13,
        fontWeight: '600',
        color: '#1E293B',
    },
    removeCompBtn: {
        width: 36,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addCompBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
        marginBottom: 12,
    },
    addCompText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    saveCancelRow: {
        flexDirection: 'row',
        gap: 10,
    },
    saveActionBtn: {
        flex: 1.3,
        height: 38,
        backgroundColor: '#4F46E5',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    saveActionText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cancelActionBtn: {
        flex: 0.7,
        height: 38,
        backgroundColor: '#E2E8F0',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    cancelActionText: {
        color: '#475569',
        fontSize: 12,
        fontWeight: 'bold',
    },
    detailsSection: {
        marginBottom: 12,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    detailChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    detailChipName: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    detailChipCost: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#EA580C',
    },
    emptyDetailsText: {
        fontSize: 12,
        color: '#94A3B8',
        fontStyle: 'italic',
        paddingVertical: 4,
    },
    marginBadge: {
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    profitBg: {
        backgroundColor: '#F0FDF4',
    },
    lossBg: {
        backgroundColor: '#FEF2F2',
    },
    marginText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    profitText: {
        color: '#166534',
    },
    lossText: {
        color: '#991B1B',
    },
    loadingArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyArea: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '90%',
        maxWidth: 400,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        maxHeight: '60%',
        padding: 16,
        elevation: 5,
        alignItems: 'stretch',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        width: '100%',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    modalList: {
        width: '100%',
    },
    modalItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        width: '100%',
        alignSelf: 'stretch',
    },
    modalItemText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    modalEmpty: {
        textAlign: 'center',
        color: '#64748B',
        fontStyle: 'italic',
        marginTop: 20,
        fontSize: 13,
        width: '100%',
    }
});

export default HppManagement;
