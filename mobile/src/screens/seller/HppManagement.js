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
    RefreshControl
} from 'react-native';
import {
    ChevronLeft,
    Search,
    Save,
    TrendingUp,
    DollarSign,
    Filter,
    Package
} from 'lucide-react-native';
import apiService from '../../api/apiService';
import { useConfirm } from '../../context/ConfirmContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HppManagement = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { confirm } = useConfirm();
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all'); // all, profit, loss, low_stock
    const [savingId, setSavingId] = useState(null);
    const [localHppValues, setLocalHppValues] = useState({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiService.get('/api/menu-items/all');
            setMenuItems(response.data.data || []);
            // Initialize local state for HPP inputs
            const initialHpp = {};
            (response.data.data || []).forEach(item => {
                initialHpp[item.id] = (item.hpp || 0).toString();
            });
            setLocalHppValues(initialHpp);
        } catch (error) {
            console.error('Error fetching menu data:', error);
            Alert.alert('Error', 'Gagal memuat data menu');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdateHpp = async (item) => {
        const newHpp = localHppValues[item.id];
        const hppValue = parseFloat(newHpp || 0);

        if (isNaN(hppValue)) {
            Alert.alert('Error', 'Nilai HPP tidak valid');
            return;
        }

        setSavingId(item.id);
        try {
            // We need to send other required fields or the backend might complain/reset them
            // Assuming PUT /api/menu-items/:id updates only provided fields or we need to send all?
            // Based on typical REST implementations, ideally PATCH would be better, but let's check MenuManagement usage.
            // In MenuManagement handleSubmit, it sends all fields. Let's try to send all fields to be safe.

            // Construct FormData as per MenuManagement
            const formData = new FormData();
            formData.append('name', item.name);
            formData.append('price', item.price);
            formData.append('stock', item.stock);
            formData.append('category', item.category);
            formData.append('hpp', hppValue);
            formData.append('discount', item.discount || 0);
            formData.append('is_featured', item.is_featured ? 1 : 0);
            formData.append('description', item.description || '');

            // We don't send image unless changed

            await apiService.put(`/api/menu-items/${item.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' } // Multer needs this
            });

            // Update local item list to reflect "saved" state if needed
            setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, hpp: hppValue } : m));
            Alert.alert('Sukses', 'HPP berhasil diperbarui');

        } catch (error) {
            console.error('Error updating HPP:', error);
            Alert.alert('Error', 'Gagal memperbarui HPP');
        } finally {
            setSavingId(null);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesFilter = true;
        const currentHpp = parseFloat(localHppValues[item.id] || item.hpp || 0);
        const margin = item.price - currentHpp;

        if (selectedFilter === 'profit') {
            matchesFilter = margin > 0;
        } else if (selectedFilter === 'loss') {
            matchesFilter = margin <= 0;
        } else if (selectedFilter === 'low_stock') {
            matchesFilter = (item.stock || 0) <= 5;
        }

        return matchesSearch && matchesFilter;
    });

    // Calculate Summary
    const totalItems = filteredItems.length;
    const totalPotentialProfit = filteredItems.reduce((acc, item) => {
        const hpp = parseFloat(localHppValues[item.id] || item.hpp || 0);
        const margin = item.price - hpp;
        // Assuming potential profit based on current stock? Or just unit margin?
        // Let's show avg margin per unit for the list
        return acc + margin;
    }, 0);
    // This sum is meaningless if not weighted. Let's calculate Total Stock Value (Assets)
    const totalAssets = filteredItems.reduce((acc, item) => {
        const hpp = parseFloat(localHppValues[item.id] || item.hpp || 0);
        return acc + (hpp * item.stock);
    }, 0);


    const renderItem = ({ item }) => {
        const currentHpp = parseFloat(localHppValues[item.id] || 0);
        const margin = item.price - currentHpp;
        const marginPercent = item.price > 0 ? (margin / item.price) * 100 : 0;
        const isProfit = margin >= 0;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemCategory}>{item.category}</Text>
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

                <View style={styles.inputRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>HPP (Modal)</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.prefix}>Rp</Text>
                            <TextInput
                                style={styles.input}
                                value={localHppValues[item.id]}
                                onChangeText={(val) => setLocalHppValues(prev => ({ ...prev, [item.id]: val }))}
                                keyboardType="numeric"
                                placeholder="0"
                            />
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.saveBtn, savingId === item.id && styles.disabledBtn]}
                        onPress={() => handleUpdateHpp(item)}
                        disabled={savingId === item.id}
                    >
                        {savingId === item.id ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Save size={20} color="#FFF" />
                        )}
                    </TouchableOpacity>
                </View>

                <View style={[styles.marginBadge, isProfit ? styles.profitBg : styles.lossBg]}>
                    <Text style={[styles.marginText, isProfit ? styles.profitText : styles.lossText]}>
                        Margin: {formatCurrency(margin)} ({marginPercent.toFixed(1)}%)
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />

            {/* Header Area */}
            <View style={styles.headerContainer}>
                {/* Navbar */}
                <View style={[styles.navbar, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Manajemen HPP</Text>
                    <TouchableOpacity style={styles.backBtn}>
                        <Filter size={20} color="#FFFFFF" />
                    </TouchableOpacity>
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
                {/* Search Bar - Floating overlapping header */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search size={20} color="#94A3B8" />
                        <TextInput
                            placeholder="Cari produk..."
                            style={styles.searchInput}
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                    </View>
                </View>

                {/* List */}
                {loading ? (
                    <View style={styles.loadingArea}>
                        <ActivityIndicator size="large" color="#1E40AF" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredItems}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={loading} onRefresh={fetchData} colors={['#1E40AF']} />
                        }
                        ListHeaderComponent={
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
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyArea}>
                                <Text style={styles.emptyText}>Tidak ada data produk</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1E40AF', // Match header color for full immersion
    },

    headerContainer: {
        backgroundColor: '#1E40AF',
        paddingBottom: 30, // Space for overlapping content
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
    summaryGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
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
    contentBody: {
        flex: 1,
        backgroundColor: '#F8FAFC', // Content background
        marginTop: -25, // Overlap header
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 0,
        overflow: 'hidden' // Ensure content respects border radius
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    searchBar: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        height: 48,
        borderRadius: 12,
        marginBottom: 10,
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
        paddingTop: 5,
        gap: 16,
        paddingBottom: 40,
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
        marginBottom: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
        flex: 1,
    },
    itemCategory: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
        marginLeft: 8,
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
        marginVertical: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
        marginBottom: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
    },
    prefix: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    saveBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#2563EB',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledBtn: {
        backgroundColor: '#94A3B8',
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
    }
});

export default HppManagement;
