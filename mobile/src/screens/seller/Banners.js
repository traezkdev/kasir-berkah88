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
    RefreshControl,
    Dimensions,
    StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getSafeBottomPadding } from '../../utils/safeArea';
import {
    ChevronLeft,
    Plus,
    Trash2,
    Image as ImageIcon,
    X,
    Check,
    Camera,
    Percent,
    Utensils,
    Star,
    Gift,
    Tag,
    Coffee,
    Zap,
    ShoppingBag,
    ArrowRight,
    Edit
} from 'lucide-react-native';
import apiService, { API_URL } from '../../api/apiService';
import * as ImagePicker from 'expo-image-picker';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const ICON_MAP = {
    Percent: Percent,
    Utensils: Utensils,
    Star: Star,
    Gift: Gift,
    Tag: Tag,
    Coffee: Coffee,
    Zap: Zap,
    ShoppingBag: ShoppingBag
};

const COLOR_MAP = {
    'bg-indigo-600': '#4F46E5',
    'bg-blue-600': '#2563EB',
    'bg-sky-500': '#0EA5E9',
    'bg-emerald-600': '#059669',
    'bg-amber-500': '#F59E0B',
    'bg-orange-500': '#F97316',
    'bg-rose-500': '#F43F5E',
    'bg-purple-600': '#9333EA',
};

const Banners = ({ navigation }) => {
    const { confirm } = useConfirm();
    const { showToast } = useToast();
    const insets = useSafeAreaInsets();
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLayoutReady, setIsLayoutReady] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        color_class: 'bg-indigo-600',
        icon_name: 'Percent',
        link_url: '',
        show_text: true,
        is_active: true
    });
    const [imageUri, setImageUri] = useState(null);
    const [isImageRemoved, setIsImageRemoved] = useState(false);

    const colors = [
        { name: 'Indigo', class: 'bg-indigo-600' },
        { name: 'Blue', class: 'bg-blue-600' },
        { name: 'Sky', class: 'bg-sky-500' },
        { name: 'Emerald', class: 'bg-emerald-600' },
        { name: 'Amber', class: 'bg-amber-500' },
        { name: 'Orange', class: 'bg-orange-500' },
        { name: 'Rose', class: 'bg-rose-500' },
        { name: 'Purple', class: 'bg-purple-600' },
    ];

    const icons = ['Percent', 'Utensils', 'Star', 'Gift', 'Tag', 'Coffee', 'Zap', 'ShoppingBag'];

    // Effect untuk menangani bug layout Android pada Modal
    useEffect(() => {
        if (isModalOpen) {
            setIsLayoutReady(false);
            const timer = setTimeout(() => {
                setIsLayoutReady(true);
            }, 100); // 100ms untuk memastikan mesin render Android siap
            return () => clearTimeout(timer);
        }
    }, [isModalOpen]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await apiService.get('/api/banners/all');
            setBanners(res.data.data || []);
        } catch (error) {
            console.error('Error fetching banners:', error);
            showToast('Gagal memuat data banner', 'error');
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
            setFormData({
                title: item.title || '',
                subtitle: item.subtitle || '',
                color_class: item.color_class || 'bg-indigo-600',
                icon_name: item.icon_name || 'Percent',
                link_url: item.link_url || '',
                show_text: item.show_text === 1 || item.show_text === true,
                is_active: item.is_active === 1 || item.is_active === true
            });
            setImageUri(item.image_url ? `${API_URL}${item.image_url}` : null);
            setIsImageRemoved(false);
        } else {
            setEditingItem(null);
            setFormData({
                title: '',
                subtitle: '',
                color_class: 'bg-indigo-600',
                icon_name: 'Percent',
                link_url: '',
                show_text: true,
                is_active: true
            });
            setImageUri(null);
            setIsImageRemoved(false);
        }
        setIsModalOpen(true);
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Izin Ditolak', 'Mohon izinkan akses galeri untuk memilih foto.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled) {
                setImageUri(result.assets[0].uri);
                setIsImageRemoved(false);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            showToast('Gagal memilih gambar', 'error');
        }
    };

    const handleSubmit = async () => {
        if (!formData.title) {
            Alert.alert('Error', 'Judul banner wajib diisi');
            return;
        }

        setIsSaving(true);
        try {
            const formDataToSend = new FormData();

            // Append data as JSON string for compatibility with web-optimized backend if needed
            // However, the web version appends 'data' as JSON under 'data' field.
            // Let's check how many fields the backend expects.
            // If the backend uses multer and then JSON.parse(req.body.data):
            formDataToSend.append('data', JSON.stringify({
                ...formData,
                remove_image: isImageRemoved
            }));

            if (imageUri && !imageUri.startsWith('http')) {
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                formDataToSend.append('image', {
                    uri: imageUri,
                    name: filename,
                    type
                });
            }

            const url = editingItem
                ? `/api/banners/${editingItem.id}`
                : `/api/banners`;
            const method = editingItem ? 'put' : 'post';

            const response = await apiService[method](url, formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.status === 200 || response.status === 201) {
                showToast(editingItem ? 'Banner diperbarui' : 'Banner ditambahkan', 'success');
                setIsModalOpen(false);
                fetchData();
            }
        } catch (error) {
            console.error('Error saving banner:', error);
            showToast('Gagal menyimpan banner', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const accepted = await confirm({
            title: 'Hapus Banner',
            message: 'Apakah Anda yakin ingin menghapus banner ini?',
            confirmText: 'Ya, Hapus',
            type: 'danger'
        });

        if (accepted) {
            try {
                await apiService.delete(`/api/banners/${id}`);
                showToast('Banner berhasil dihapus', 'success');
                fetchData();
            } catch (error) {
                console.error('Error deleting banner:', error);
                showToast('Gagal menghapus banner', 'error');
            }
        }
    };

    const renderBanner = ({ item }) => {
        const IconComp = ICON_MAP[item.icon_name] || Percent;
        const bgColor = COLOR_MAP[item.color_class] || '#4F46E5';

        return (
            <View style={styles.bannerCard}>
                <View style={[styles.bannerPreview, { backgroundColor: bgColor }]}>
                    {/* Background Image */}
                    {item.image_url && (
                        <Image
                            source={{ uri: `${API_URL}${item.image_url}` }}
                            style={styles.bannerBackgroundImage}
                            resizeMode="cover"
                        />
                    )}
                    {/* Overlay untuk memastikan text tetap terbaca */}
                    {item.image_url && (item.show_text === 1 || item.show_text === true) && <View style={styles.bannerOverlay} />}

                    {/* Background decoration */}
                    {(item.show_text === 1 || item.show_text === true) && (
                        <IconComp
                            size={120}
                            color="#FFFFFF"
                            style={styles.bgDecoration}
                            strokeWidth={1}
                            opacity={0.1}
                        />
                    )}

                    <View style={styles.bannerContentWrapper}>
                        {item.show_text === 1 || item.show_text === true ? (
                            <View style={styles.bannerContent}>
                                <View style={styles.bannerText}>
                                    <Text style={styles.bannerTitle} numberOfLines={1}>{item.title}</Text>
                                    <Text style={styles.bannerSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                                </View>
                                <View style={styles.bannerIconBadge}>
                                    <IconComp size={22} color="#FFFFFF" strokeWidth={2.5} />
                                </View>
                            </View>
                        ) : null}
                        <View style={styles.bannerFooter}>
                            <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Text style={styles.statusText}>
                                    {item.is_active ? 'AKTIF' : 'NON-AKTIF'}
                                </Text>
                            </View>
                            <View style={styles.arrowCircle}>
                                <ArrowRight size={14} color="#1E293B" />
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity
                        onPress={() => handleOpenModal(item)}
                        style={styles.editBtn}
                    >
                        <Edit size={18} color="#64748B" />
                        <Text style={styles.editBtnText}>Edit</Text>
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
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kelola Banner</Text>
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
                    data={banners}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    renderItem={renderBanner}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#138FEA']}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyArea}>
                            <ImageIcon size={60} color="#E2E8F0" />
                            <Text style={styles.emptyText}>Belum ada banner promosi</Text>
                            <TouchableOpacity
                                style={styles.emptyAddBtn}
                                onPress={() => handleOpenModal()}
                            >
                                <Text style={styles.emptyAddText}>Buat Banner Sekarang</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            <Modal
                visible={isModalOpen}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setIsModalOpen(false)}
            >
                {/* Gunakan tinggi eksplisit untuk mematikan ketidakpastian layout Android */}
                <View style={[styles.modalContainer, { height: windowHeight, backgroundColor: '#FFFFFF' }]}>
                    {/* Header */}
                    <View style={[styles.modalHeader, {
                        paddingTop: Math.max(insets.top + 10, 20),
                        borderBottomWidth: 1,
                        borderBottomColor: '#F1F5F9',
                        backgroundColor: '#FFFFFF'
                    }]}>
                        <View>
                            <Text style={styles.modalTitle}>{editingItem ? 'Edit' : 'Buat'} Banner</Text>
                            <Text style={styles.modalSubtitle}>KONFIGURASI TAMPILAN</Text>
                        </View>
                        <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeBtn}>
                            <X size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* Konten Utama: Menggunakan flex: 1 untuk mendorong footer ke bawah */}
                    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
                        <KeyboardAwareScrollView
                            style={{ flex: 1 }}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            enableOnAndroid={true}
                            extraScrollHeight={Platform.OS === 'ios' ? 40 : 20}
                            contentContainerStyle={[
                                styles.scrollBodyContent,
                                { paddingBottom: 40 } // Padding agar item terakhir tidak mepet footer
                            ]}
                        >
                            {/* Hanya tampilkan konten jika layout sudah 'Ready' (Hack untuk Android) */}
                            {isLayoutReady ? (
                                <View style={styles.formSection}>
                                    {/* Live Preview */}
                                    <Text style={styles.labelGroup}>PRATINJAU LANGSUNG</Text>
                                    <View style={[styles.bannerPreview, { backgroundColor: COLOR_MAP[formData.color_class] || '#4F46E5', marginBottom: 30 }]}>
                                        {imageUri && (
                                            <Image
                                                source={{ uri: imageUri }}
                                                style={styles.bannerBackgroundImage}
                                                resizeMode="cover"
                                            />
                                        )}
                                        {imageUri && formData.show_text && <View style={styles.bannerOverlay} />}

                                        {formData.show_text && React.createElement(ICON_MAP[formData.icon_name] || Percent, {
                                            size: 120,
                                            color: '#FFFFFF',
                                            style: styles.bgDecoration,
                                            strokeWidth: 1,
                                            opacity: 0.1
                                        })}

                                        <View style={styles.bannerContentWrapper}>
                                            {formData.show_text ? (
                                                <View style={styles.bannerContent}>
                                                    <View style={styles.bannerText}>
                                                        <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900' }}>{formData.title || 'Judul Banner'}</Text>
                                                        <Text style={{ color: '#FFFFFF', fontSize: 13, opacity: 0.8, marginTop: 2 }}>{formData.subtitle || 'Sub-titel banner Anda'}</Text>
                                                    </View>
                                                    <View style={styles.bannerIconBadge}>
                                                        {React.createElement(ICON_MAP[formData.icon_name] || Percent, { size: 24, color: '#FFFFFF', strokeWidth: 2.5 })}
                                                    </View>
                                                </View>
                                            ) : null}
                                            <View style={styles.bannerFooter}>
                                                <View style={styles.footerLine} />
                                                <View style={styles.arrowCircle}>
                                                    <ArrowRight size={14} color="#1E293B" />
                                                </View>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Form Inputs */}
                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>JUDUL KONTEN</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Contoh: Diskon Kopi 50%"
                                            value={formData.title}
                                            onChangeText={(val) => setFormData({ ...formData, title: val })}
                                        />
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>GAMBAR LATAR BELAKANG (OPSIONAL)</Text>
                                        <TouchableOpacity onPress={pickImage} style={styles.imageUploadBox}>
                                            {imageUri ? (
                                                <View style={styles.imagePreviewContainer}>
                                                    <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                                                    <View style={styles.imageOverlay}>
                                                        <Camera size={24} color="#FFFFFF" />
                                                        <Text style={styles.imageOverlayText}>Ganti Gambar</Text>
                                                    </View>
                                                </View>
                                            ) : (
                                                <View style={styles.uploadPlaceholder}>
                                                    <ImageIcon size={32} color="#94A3B8" />
                                                    <Text style={styles.uploadText}>Pilih Gambar</Text>
                                                    <Text style={styles.uploadHint}>Rasio 16:9 • Max 2MB</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                        {imageUri && (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setImageUri(null);
                                                    setIsImageRemoved(true);
                                                }}
                                                style={styles.removeImageBtn}
                                            >
                                                <X size={16} color="#EF4444" />
                                                <Text style={styles.removeImageText}>Hapus Gambar</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>DESKRIPSI / SUB-TITEL</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Contoh: Berlaku s/d jam 10 pagi"
                                            value={formData.subtitle}
                                            onChangeText={(val) => setFormData({ ...formData, subtitle: val })}
                                        />
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>WARNA UTAMA</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorGrid}>
                                            {colors.map(color => (
                                                <TouchableOpacity
                                                    key={color.class}
                                                    onPress={() => setFormData({ ...formData, color_class: color.class })}
                                                    style={[
                                                        styles.colorCircle,
                                                        { backgroundColor: COLOR_MAP[color.class] },
                                                        formData.color_class === color.class && styles.activeColor
                                                    ]}
                                                />
                                            ))}
                                        </ScrollView>
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>IKON ILUSTRASI</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconGrid}>
                                            {icons.map(iconName => {
                                                const IconComp = ICON_MAP[iconName];
                                                const isActive = formData.icon_name === iconName;
                                                return (
                                                    <TouchableOpacity
                                                        key={iconName}
                                                        onPress={() => setFormData({ ...formData, icon_name: iconName })}
                                                        style={[styles.iconBox, isActive && styles.activeIconBox]}
                                                    >
                                                        <IconComp size={20} color={isActive ? '#FFFFFF' : '#94A3B8'} />
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    </View>

                                    <View style={styles.toggleRow}>
                                        <View>
                                            <Text style={styles.toggleTitle}>Tampilkan Teks & Tombol</Text>
                                            <Text style={styles.toggleSubtitle}>Sembunyikan jika hanya ingin gambar banner saja</Text>
                                        </View>
                                        <Switch
                                            value={formData.show_text}
                                            onValueChange={(val) => setFormData({ ...formData, show_text: val })}
                                            trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                                            thumbColor={formData.show_text ? '#2563EB' : '#F8FAFC'}
                                        />
                                    </View>

                                    <View style={styles.toggleRow}>
                                        <View>
                                            <Text style={styles.toggleTitle}>Status Banner Aktif</Text>
                                            <Text style={styles.toggleSubtitle}>Munculkan banner di dashboard pelanggan</Text>
                                        </View>
                                        <Switch
                                            value={formData.is_active}
                                            onValueChange={(val) => setFormData({ ...formData, is_active: val })}
                                            trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                                            thumbColor={formData.is_active ? '#2563EB' : '#F8FAFC'}
                                        />
                                    </View>
                                </View>
                            ) : (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                                    <ActivityIndicator size="large" color="#2563EB" />
                                </View>
                            )}
                        </KeyboardAwareScrollView>
                    </View>

                    {/* Footer / Navbar: Pola standard (non-absolute) agar tidak menutupi konten */}
                    <View style={[
                        styles.modalFooter,
                        {
                            paddingBottom: Math.max(insets.bottom, 24),
                            backgroundColor: '#FFFFFF',
                            borderTopWidth: 1,
                            borderTopColor: '#F1F5F9',
                            elevation: 10,
                            zIndex: 10
                        }
                    ]}>
                        <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.cancelBtn}>
                            <Text style={styles.cancelBtnText}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={isSaving}
                            style={styles.saveBtn}
                        >
                            <Text style={styles.saveBtnText}>{isSaving ? 'Memproses...' : (editingItem ? 'Simpan Update' : 'Terbitkan')}</Text>
                            {!isSaving && <Check size={20} color="#FFFFFF" />}
                        </TouchableOpacity>
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
        gap: 20,
    },
    bannerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            android: { elevation: 3 },
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }
        })
    },
    bannerPreview: {
        height: 160,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 20,
    },
    bannerContentWrapper: {
        ...StyleSheet.absoluteFillObject,
        padding: 24,
        justifyContent: 'space-between',
        zIndex: 10,
    },
    bannerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 10,
    },
    bannerText: {
        flex: 1,
        marginRight: 10,
    },
    bannerTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
    },
    bannerSubtitle: {
        color: '#FFFFFF',
        fontSize: 13,
        opacity: 0.8,
        marginTop: 2,
    },
    bannerIconBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 10,
        borderRadius: 15,
    },
    bannerFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    footerLine: {
        height: 4,
        width: 30,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
    },
    arrowCircle: {
        width: 28,
        height: 28,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bgDecoration: {
        position: 'absolute',
        bottom: -30,
        right: -30,
        transform: [{ rotate: '15deg' }],
    },
    cardActions: {
        padding: 16,
        flexDirection: 'row',
        gap: 12,
    },
    editBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        paddingVertical: 12,
        borderRadius: 15,
        gap: 8,
    },
    editBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
    },
    deleteBtn: {
        width: 48,
        height: 48,
        backgroundColor: '#FEF2F2',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    emptyAddBtn: {
        marginTop: 20,
        backgroundColor: '#138FEA',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyAddText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    // Modal
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 10,
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
    closeBtn: {
        backgroundColor: '#F8FAFC',
        padding: 8,
        borderRadius: 12,
    },
    scrollBody: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    modalScrollContainer: {
        flex: 1,
    },
    scrollBodyContent: {
        paddingBottom: 20,
        padding: 24,
        flexGrow: 1,
    },
    receiptBody: {
        padding: 24,
    },
    labelGroup: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    formSection: {
        gap: 20,
        paddingBottom: 40,
    },
    formGroup: {
        gap: 8,
    },
    label: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 14,
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    colorGrid: {
        gap: 12,
        paddingVertical: 5,
    },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    activeColor: {
        borderColor: '#138FEA',
        transform: [{ scale: 1.1 }],
    },
    iconGrid: {
        gap: 12,
        paddingVertical: 5,
    },
    iconBox: {
        width: 48,
        height: 48,
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    activeIconBox: {
        backgroundColor: '#138FEA',
        borderColor: '#138FEA',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        marginTop: 10,
    },
    toggleTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    toggleSubtitle: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },
    modalFooter: {
        padding: 24,
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
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#64748B',
    },
    saveBtn: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563EB',
        borderRadius: 16,
        gap: 10,
    },
    saveBtnText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    // Background Image Styles
    bannerBackgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    bannerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 20,
    },
    // Image Upload Styles
    imageUploadBox: {
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        borderStyle: 'dashed',
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
    },
    imagePreviewContainer: {
        width: '100%',
        height: 180,
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    imageOverlayText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    uploadPlaceholder: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    uploadText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 8,
    },
    uploadHint: {
        fontSize: 12,
        color: '#94A3B8',
    },
    removeImageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    removeImageText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#EF4444',
    },
});

export default Banners;
