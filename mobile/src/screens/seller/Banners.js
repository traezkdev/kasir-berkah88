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
    StatusBar,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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

const ICON_MAP = {
    Percent,
    Utensils,
    Star,
    Gift,
    Tag,
    Coffee,
    Zap,
    ShoppingBag
};

const COLOR_MAP = {
    'bg-indigo-600': '#4F46E5',
    'bg-blue-600': '#2563EB',
    'bg-sky-500': '#0EA5E9',
    'bg-emerald-600': '#059669',
    'bg-green-600': '#16A34A',
    'bg-amber-500': '#F59E0B',
    'bg-orange-500': '#F97316',
    'bg-rose-500': '#F43F5E',
    'bg-purple-600': '#9333EA',
    'bg-red-600': '#DC2626',
    'bg-teal-600': '#0D9488',
    'bg-slate-700': '#334155',
};

const getBannerIcon = (iconName) => {
    if (!iconName) return Percent;
    if (ICON_MAP[iconName]) return ICON_MAP[iconName];
    const match = Object.keys(ICON_MAP).find(k => k.toLowerCase() === String(iconName).toLowerCase());
    return match ? ICON_MAP[match] : Percent;
};

const getBannerColor = (colorClass) => {
    if (!colorClass) return '#4F46E5';
    return COLOR_MAP[colorClass] || '#4F46E5';
};

const getImageUrl = (url) => {
    if (!url || typeof url !== 'string' || !url.trim()) return null;
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const uriToBlob = async (uri) => {
    if (!uri) return null;
    if (uri.startsWith('data:')) {
        const arr = uri.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }
    const res = await fetch(uri);
    return await res.blob();
};

const Banners = ({ navigation }) => {
    const { confirm } = useConfirm();
    const { showToast } = useToast();
    const insets = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();

    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLayoutReady, setIsLayoutReady] = useState(Platform.OS === 'web');
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
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [hasNewImage, setHasNewImage] = useState(false);
    const [isImageRemoved, setIsImageRemoved] = useState(false);

    const colors = [
        { name: 'Indigo', class: 'bg-indigo-600' },
        { name: 'Blue', class: 'bg-blue-600' },
        { name: 'Sky', class: 'bg-sky-500' },
        { name: 'Emerald', class: 'bg-emerald-600' },
        { name: 'Green', class: 'bg-green-600' },
        { name: 'Amber', class: 'bg-amber-500' },
        { name: 'Orange', class: 'bg-orange-500' },
        { name: 'Rose', class: 'bg-rose-500' },
        { name: 'Purple', class: 'bg-purple-600' },
        { name: 'Slate', class: 'bg-slate-700' },
    ];

    const icons = ['Percent', 'Utensils', 'Star', 'Gift', 'Tag', 'Coffee', 'Zap', 'ShoppingBag'];

    useEffect(() => {
        if (isModalOpen) {
            if (Platform.OS === 'web') {
                setIsLayoutReady(true);
            } else {
                setIsLayoutReady(false);
                const timer = setTimeout(() => {
                    setIsLayoutReady(true);
                }, 80);
                return () => clearTimeout(timer);
            }
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
                show_text: item.show_text === 1 || item.show_text === true || item.show_text === '1' || item.show_text === undefined,
                is_active: item.is_active === 1 || item.is_active === true || item.is_active === '1' || item.is_active === undefined
            });
            setImageUri(getImageUrl(item.image_url));
            setSelectedImageFile(null);
            setHasNewImage(false);
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
            setSelectedImageFile(null);
            setHasNewImage(false);
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
                mediaTypes: ['images'],
                allowsEditing: Platform.OS !== 'web',
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                console.log('[Banners] Selected image:', asset.uri, 'file:', asset.file);
                setImageUri(asset.uri);
                setSelectedImageFile(asset.file || null);
                setHasNewImage(true);
                setIsImageRemoved(false);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            showToast('Gagal memilih gambar', 'error');
        }
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.title.trim()) {
            Alert.alert('Peringatan', 'Judul banner wajib diisi');
            return;
        }

        setIsSaving(true);
        try {
            const formDataToSend = new FormData();

            // Append metadata payload
            formDataToSend.append('data', JSON.stringify({
                ...formData,
                title: formData.title.trim(),
                subtitle: formData.subtitle ? formData.subtitle.trim() : '',
                link_url: formData.link_url ? formData.link_url.trim() : '',
                remove_image: isImageRemoved
            }));

            // Handle newly selected image
            if (hasNewImage && imageUri) {
                if (Platform.OS === 'web') {
                    if (selectedImageFile) {
                        formDataToSend.append('image', selectedImageFile, selectedImageFile.name || 'banner.jpg');
                    } else {
                        try {
                            const blob = await uriToBlob(imageUri);
                            if (blob) {
                                formDataToSend.append('image', blob, 'banner.jpg');
                            }
                        } catch (blobErr) {
                            console.error('Error converting image to blob on web:', blobErr);
                        }
                    }
                } else {
                    const filename = imageUri.split('/').pop() || 'banner.jpg';
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
                ? `/api/banners/${editingItem.id}`
                : `/api/banners`;
            const method = editingItem ? 'put' : 'post';

            const response = await apiService[method](url, formDataToSend);

            if (response.status === 200 || response.status === 201) {
                showToast(editingItem ? 'Banner berhasil diperbarui' : 'Banner berhasil ditambahkan', 'success');
                setIsModalOpen(false);
                fetchData();
            }
        } catch (error) {
            console.error('Error saving banner:', error);
            const errMsg = error.response?.data?.error || 'Gagal menyimpan banner';
            showToast(errMsg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        let accepted = false;
        try {
            accepted = await confirm({
                title: 'Hapus Banner',
                message: 'Apakah Anda yakin ingin menghapus banner ini?',
                confirmText: 'Ya, Hapus',
                type: 'danger'
            });
        } catch (e) {
            accepted = typeof window !== 'undefined' && window.confirm
                ? window.confirm('Apakah Anda yakin ingin menghapus banner ini?')
                : true;
        }

        if (accepted) {
            try {
                await apiService.delete(`/api/banners/${id}`);
                showToast('Banner berhasil dihapus', 'success');
                fetchData();
            } catch (error) {
                console.error('Error deleting banner:', error);
                const errMsg = error.response?.data?.error || 'Gagal menghapus banner';
                showToast(errMsg, 'error');
            }
        }
    };

    const renderBanner = ({ item }) => {
        const IconComp = getBannerIcon(item.icon_name);
        const bgColor = getBannerColor(item.color_class);
        const bannerImgUri = getImageUrl(item.image_url);
        const shouldShowText = item.show_text === 1 || item.show_text === true || item.show_text === '1' || item.show_text === undefined;

        return (
            <View style={styles.bannerCard}>
                <View style={[styles.bannerPreview, { backgroundColor: bgColor }]}>
                    {/* Background Image */}
                    {bannerImgUri ? (
                        <Image
                            source={{ uri: bannerImgUri }}
                            style={styles.bannerBackgroundImage}
                            resizeMode="cover"
                        />
                    ) : null}

                    {/* Overlay untuk memastikan text tetap terbaca */}
                    {bannerImgUri && shouldShowText ? (
                        <View style={styles.bannerOverlay} />
                    ) : null}

                    {/* Background decoration */}
                    {shouldShowText ? (
                        <IconComp
                            size={120}
                            color="#FFFFFF"
                            style={styles.bgDecoration}
                            strokeWidth={1}
                            opacity={0.1}
                        />
                    ) : null}

                    <View style={styles.bannerContentWrapper}>
                        {shouldShowText ? (
                            <View style={styles.bannerContent}>
                                <View style={styles.bannerText}>
                                    <Text style={styles.bannerTitle} numberOfLines={1}>{item.title || ''}</Text>
                                    <Text style={styles.bannerSubtitle} numberOfLines={1}>{item.subtitle || ''}</Text>
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
                        activeOpacity={0.7}
                    >
                        <Edit size={18} color="#475569" />
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        style={styles.deleteBtn}
                        activeOpacity={0.7}
                    >
                        <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const FormScrollContainer = Platform.OS === 'web' ? ScrollView : KeyboardAwareScrollView;
    const ModalIcon = getBannerIcon(formData.icon_name);

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
                <View style={[
                    styles.modalContainer,
                    Platform.OS === 'android' ? { height: windowHeight } : { flex: 1 }
                ]}>
                    {/* Header Modal */}
                    <View style={[styles.modalHeader, {
                        paddingTop: Math.max(insets.top + 10, 16),
                        borderBottomWidth: 1,
                        borderBottomColor: '#F1F5F9',
                        backgroundColor: '#FFFFFF'
                    }]}>
                        <View>
                            <Text style={styles.modalTitle}>{editingItem ? 'Edit' : 'Buat'} Banner</Text>
                            <Text style={styles.modalSubtitle}>KONFIGURASI TAMPILAN BANNER</Text>
                        </View>
                        <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeBtn}>
                            <X size={22} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* Konten Scroll Modal */}
                    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
                        <FormScrollContainer
                            style={{ flex: 1 }}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            enableOnAndroid={true}
                            extraScrollHeight={Platform.OS === 'ios' ? 40 : 20}
                            contentContainerStyle={[
                                styles.scrollBodyContent,
                                { paddingBottom: 40 }
                            ]}
                        >
                            {isLayoutReady ? (
                                <View style={styles.formSection}>
                                    {/* Live Preview */}
                                    <Text style={styles.labelGroup}>PRATINJAU LANGSUNG</Text>
                                    <View style={[
                                        styles.bannerPreview,
                                        { backgroundColor: getBannerColor(formData.color_class), marginBottom: 24 }
                                    ]}>
                                        {imageUri ? (
                                            <Image
                                                source={{ uri: imageUri }}
                                                style={styles.bannerBackgroundImage}
                                                resizeMode="cover"
                                            />
                                        ) : null}

                                        {imageUri && formData.show_text ? (
                                            <View style={styles.bannerOverlay} />
                                        ) : null}

                                        {formData.show_text ? (
                                            <ModalIcon
                                                size={120}
                                                color="#FFFFFF"
                                                style={styles.bgDecoration}
                                                strokeWidth={1}
                                                opacity={0.1}
                                            />
                                        ) : null}

                                        <View style={styles.bannerContentWrapper}>
                                            {formData.show_text ? (
                                                <View style={styles.bannerContent}>
                                                    <View style={styles.bannerText}>
                                                        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900' }}>
                                                            {formData.title || 'Judul Banner'}
                                                        </Text>
                                                        <Text style={{ color: '#FFFFFF', fontSize: 13, opacity: 0.85, marginTop: 2 }}>
                                                            {formData.subtitle || 'Sub-titel banner Anda'}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.bannerIconBadge}>
                                                        <ModalIcon size={22} color="#FFFFFF" strokeWidth={2.5} />
                                                    </View>
                                                </View>
                                            ) : null}
                                            <View style={styles.bannerFooter}>
                                                <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                                    <Text style={styles.statusText}>
                                                        {formData.is_active ? 'AKTIF' : 'NON-AKTIF'}
                                                    </Text>
                                                </View>
                                                <View style={styles.arrowCircle}>
                                                    <ArrowRight size={14} color="#1E293B" />
                                                </View>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Form Inputs */}
                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>JUDUL KONTEN *</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Contoh: Promo Spesial Hari Ini"
                                            placeholderTextColor="#94A3B8"
                                            value={formData.title}
                                            onChangeText={(val) => setFormData(prev => ({ ...prev, title: val }))}
                                        />
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>DESKRIPSI / SUB-TITEL</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Contoh: Nikmati potongan harga hingga 50%"
                                            placeholderTextColor="#94A3B8"
                                            value={formData.subtitle}
                                            onChangeText={(val) => setFormData(prev => ({ ...prev, subtitle: val }))}
                                        />
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>TAUTAN / LINK TUJUAN (OPSIONAL)</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Contoh: /menu atau https://..."
                                            placeholderTextColor="#94A3B8"
                                            value={formData.link_url}
                                            onChangeText={(val) => setFormData(prev => ({ ...prev, link_url: val }))}
                                            autoCapitalize="none"
                                        />
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>GAMBAR LATAR BELAKANG (OPSIONAL)</Text>
                                        <TouchableOpacity onPress={pickImage} style={styles.imageUploadBox} activeOpacity={0.8}>
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
                                                    <Text style={styles.uploadText}>Pilih Gambar Banner</Text>
                                                    <Text style={styles.uploadHint}>Rasio 16:9 disarankan</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                        {imageUri ? (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setImageUri(null);
                                                    setSelectedImageFile(null);
                                                    setHasNewImage(false);
                                                    setIsImageRemoved(true);
                                                }}
                                                style={styles.removeImageBtn}
                                            >
                                                <X size={16} color="#EF4444" />
                                                <Text style={styles.removeImageText}>Hapus Gambar</Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>WARNA TEMA UTAMA</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorGrid}>
                                            {colors.map(color => (
                                                <TouchableOpacity
                                                    key={color.class}
                                                    onPress={() => setFormData(prev => ({ ...prev, color_class: color.class }))}
                                                    style={[
                                                        styles.colorCircle,
                                                        { backgroundColor: COLOR_MAP[color.class] || '#4F46E5' },
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
                                                const IconComponent = getBannerIcon(iconName);
                                                const isActive = formData.icon_name === iconName;
                                                return (
                                                    <TouchableOpacity
                                                        key={iconName}
                                                        onPress={() => setFormData(prev => ({ ...prev, icon_name: iconName }))}
                                                        style={[styles.iconBox, isActive && styles.activeIconBox]}
                                                    >
                                                        <IconComponent size={20} color={isActive ? '#FFFFFF' : '#64748B'} />
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    </View>

                                    <View style={styles.toggleRow}>
                                        <View style={{ flex: 1, paddingRight: 12 }}>
                                            <Text style={styles.toggleTitle}>Tampilkan Teks & Tombol</Text>
                                            <Text style={styles.toggleSubtitle}>Sembunyikan teks jika gambar sudah memiliki tulisan promo</Text>
                                        </View>
                                        <Switch
                                            value={formData.show_text}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, show_text: val }))}
                                            trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                                            thumbColor={formData.show_text ? '#2563EB' : '#F8FAFC'}
                                        />
                                    </View>

                                    <View style={styles.toggleRow}>
                                        <View style={{ flex: 1, paddingRight: 12 }}>
                                            <Text style={styles.toggleTitle}>Status Banner Aktif</Text>
                                            <Text style={styles.toggleSubtitle}>Tampilkan banner ini di dashboard aplikasi pelanggan</Text>
                                        </View>
                                        <Switch
                                            value={formData.is_active}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, is_active: val }))}
                                            trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                                            thumbColor={formData.is_active ? '#2563EB' : '#F8FAFC'}
                                        />
                                    </View>
                                </View>
                            ) : (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                                    <ActivityIndicator size="large" color="#2563EB" />
                                </View>
                            )}
                        </FormScrollContainer>
                    </View>

                    {/* Footer Modal */}
                    <View style={[
                        styles.modalFooter,
                        {
                            paddingBottom: Math.max(insets.bottom, 20),
                            backgroundColor: '#FFFFFF',
                            borderTopWidth: 1,
                            borderTopColor: '#F1F5F9',
                            elevation: 10,
                            zIndex: 10
                        }
                    ]}>
                        <TouchableOpacity
                            onPress={() => setIsModalOpen(false)}
                            style={styles.cancelBtn}
                            disabled={isSaving}
                        >
                            <Text style={styles.cancelBtnText}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={isSaving}
                            style={styles.saveBtn}
                        >
                            <Text style={styles.saveBtnText}>
                                {isSaving ? 'Menyimpan...' : (editingItem ? 'Simpan Update' : 'Terbitkan')}
                            </Text>
                            {!isSaving ? <Check size={18} color="#FFFFFF" /> : null}
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
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
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
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
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
        gap: 16,
    },
    bannerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            android: { elevation: 3 },
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
            web: { boxShadow: '0px 4px 16px rgba(0,0,0,0.06)' }
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
        padding: 20,
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
        fontSize: 20,
        fontWeight: '900',
    },
    bannerSubtitle: {
        color: '#FFFFFF',
        fontSize: 13,
        opacity: 0.85,
        marginTop: 2,
    },
    bannerIconBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 10,
        borderRadius: 14,
    },
    bannerFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
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
        padding: 14,
        flexDirection: 'row',
        gap: 10,
    },
    editBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        paddingVertical: 12,
        borderRadius: 14,
        gap: 8,
    },
    editBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#475569',
    },
    deleteBtn: {
        width: 46,
        height: 46,
        backgroundColor: '#FEF2F2',
        borderRadius: 14,
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
        backgroundColor: '#FFFFFF',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
    },
    modalSubtitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginTop: 2,
    },
    closeBtn: {
        backgroundColor: '#F1F5F9',
        padding: 8,
        borderRadius: 12,
    },
    scrollBodyContent: {
        padding: 20,
    },
    labelGroup: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 10,
    },
    formSection: {
        gap: 18,
    },
    formGroup: {
        gap: 8,
    },
    label: {
        fontSize: 11,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 0.8,
        marginLeft: 2,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    colorGrid: {
        gap: 10,
        paddingVertical: 6,
    },
    colorCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 3,
        borderColor: 'transparent',
    },
    activeColor: {
        borderColor: '#0F172A',
        transform: [{ scale: 1.15 }],
    },
    iconGrid: {
        gap: 10,
        paddingVertical: 6,
    },
    iconBox: {
        width: 46,
        height: 46,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    activeIconBox: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginTop: 6,
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
        padding: 20,
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 14,
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
    },
    saveBtn: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563EB',
        borderRadius: 14,
        gap: 8,
    },
    saveBtnText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
    },
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
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        borderRadius: 20,
    },
    imageUploadBox: {
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderRadius: 14,
        borderStyle: 'dashed',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
    },
    imagePreviewContainer: {
        width: '100%',
        height: 160,
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
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    imageOverlayText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    uploadPlaceholder: {
        paddingVertical: 32,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    uploadText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    uploadHint: {
        fontSize: 11,
        color: '#94A3B8',
    },
    removeImageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 8,
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: '#FEF2F2',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        alignSelf: 'flex-start',
    },
    removeImageText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#EF4444',
    },
});

export default Banners;
