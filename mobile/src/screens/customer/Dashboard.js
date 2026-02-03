import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    Image,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Dimensions,
    Platform
} from 'react-native';
import { Search, ShoppingBag, Plus, Star } from 'lucide-react-native';
import apiService, { API_URL } from '../../api/apiService';

const { width } = Dimensions.get('window');
const columnWidth = (width - 48) / 2;

const CustomerDashboard = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        try {
            const response = await apiService.get('/api/public/menu-items');
            setMenuItems(response.data.data);
        } catch (error) {
            console.error('Error fetching menu:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card}>
            <Image
                source={{ uri: item.image_url ? `${API_URL}${item.image_url}` : 'https://via.placeholder.com/150' }}
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.cardContent}>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.ratingInfo}>
                    <Star size={12} color="#FBBF24" fill="#FBBF24" />
                    <Text style={styles.ratingText}>{item.average_rating?.toFixed(1) || '5.0'}</Text>
                </View>
                <View style={styles.priceRow}>
                    <Text style={styles.price}>{formatPrice(item.price)}</Text>
                    <TouchableOpacity style={styles.addButton}>
                        <Plus size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#138FEA" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcome}>Mau makan apa hari ini?</Text>
                    <Text style={styles.brand}>Kasir Berkah88</Text>
                </View>
                <TouchableOpacity style={styles.cartBtn}>
                    <ShoppingBag size={24} color="#1E293B" />
                    <View style={styles.cartBadge} />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Search size={20} color="#94A3B8" />
                <TextInput
                    placeholder="Cari menu favorit Anda..."
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Menu List */}
            <FlatList
                data={menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                numColumns={2}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingTop: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    welcome: {
        fontSize: 14,
        color: '#64748B',
    },
    brand: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    cartBtn: {
        width: 45,
        height: 45,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cartBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 10,
        height: 10,
        backgroundColor: '#EF4444',
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        paddingHorizontal: 16,
        height: 50,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#1E293B',
    },
    listContainer: {
        paddingHorizontal: 14,
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        width: columnWidth,
        margin: 7,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        // Shadow for premium look
        ...Platform.select({
            web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' },
            android: { elevation: 2 }
        })
    },
    image: {
        width: '100%',
        height: 120,
    },
    cardContent: {
        padding: 12,
    },
    category: {
        fontSize: 10,
        color: '#138FEA',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    itemName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    ratingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingText: {
        fontSize: 12,
        color: '#64748B',
        marginLeft: 4,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    addButton: {
        backgroundColor: '#138FEA',
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default CustomerDashboard;
