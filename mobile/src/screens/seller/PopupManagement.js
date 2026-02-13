import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
    Switch,
    TextInput,
    KeyboardAvoidingView,
    RefreshControl,
    Modal,
    ImageBackground
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomModalTemplate from '../../components/templates/BottomModalTemplate';
import {
    ChevronLeft,
    Plus,
    Trash2,
    Image as ImageIcon,
    Send,
    Camera,
    CheckCircle2,
    Check,
    Edit2,
    Eye,
    Megaphone,
    TrendingUp,
    MousePointer2,
    BarChart3,
    Link2,
    AlertTriangle,
    Info
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import apiService, { API_URL } from '../../api/apiService';

const AVAILABLE_PAGES = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'menu', label: 'Menu' },
    { value: 'cart', label: 'Keranjang' },
    { value: 'profile', label: 'Profil' },
    { value: 'promo', label: 'Promo' },
    { value: 'orders', label: 'Pesanan' },
    { value: 'points', label: 'Poin' },
];

const LINK_TYPES = [
    { value: 'none', label: 'Tidak Ada Link' },
    { value: 'screen', label: 'Link ke Halaman' },
    { value: 'url', label: 'Link ke URL' },
];

const SCREEN_OPTIONS = [
    { value: 'Promo', label: 'Halaman Promo' },
    { value: 'Menu', label: 'Menu' },
    { value: 'InformationScreen', label: 'Pusat Info' },
];

const PopupManagement = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [popups, setPopups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingPopup, setEditingPopup] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        image: null,
        imageUri: null,
        link_type: 'none',
        link_value: '',
        show_on_pages: [],
        priority: 0,
        is_active: true,
    });

    const [confirmConfig, setConfirmConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'primary',
        confirmText: 'Ya',
        onConfirm: null,
        icon: null,
        isAlert: false,
    });

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPopup(null);
    };

    const showConfirm = (config) => {
        setConfirmConfig({
            visible: true,
            title: config.title || 'Konfirmasi',
            message: config.message || '',
            type: config.type || 'primary',
            confirmText: config.confirmText || 'Ya, Lanjutkan',
            onConfirm: config.onConfirm,
            icon: config.icon || null,
            isAlert: false,
        });
    };

    const showAlert = (config) => {
        setConfirmConfig({
            visible: true,
            title: config.title || 'Informasi',
            message: config.message || '',
            type: config.type || 'primary',
            confirmText: config.confirmText || 'Dimengerti',
            onConfirm: config.onConfirm || null,
            icon: config.icon || null,
            isAlert: true,
        });
    };

    const handleConfirmClose = () => {
        setConfirmConfig(prev => ({ ...prev, visible: false }));
    };

    const handleConfirmAction = async () => {
        if (confirmConfig.onConfirm) {
            await confirmConfig.onConfirm();
        }
        handleConfirmClose();
    };

    const handleOpenModal = (popup = null) => {
        if (popup) {
            setEditingPopup(popup);
            setFormData({
                title: popup.title,
                image: null,
                imageUri: popup.image_url ? `${API_URL}${popup.image_url.startsWith('/') ? '' : '/'}${popup.image_url}` : null,
                link_type: popup.link_type || 'none',
                link_value: popup.link_value || '',
                show_on_pages: popup.show_on_pages || [],
                priority: popup.priority || 0,
                is_active: popup.is_active,
            });
        } else {
            setEditingPopup(null);
            setFormData({
                title: '',
                image: null,
                imageUri: null,
                link_type: 'none',
                link_value: '',
                show_on_pages: [],
                priority: 0,
                is_active: true,
            });
        }
        setShowModal(true);
    };

    const fetchPopups = async () => {
        try {
            const response = await apiService.get('/api/popups');
            if (response.data && response.data.message === 'success') {
                setPopups(Array.isArray(response.data.data) ? response.data.data : []);
            } else if (Array.isArray(response.data)) {
                setPopups(response.data);
            }
        } catch (error) {
            console.error('Error fetching popups:', error);
            showAlert({
                title: 'Gagal Memuat',
                message: 'Tidak dapat mengambil data popup dari server.',
                type: 'danger'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPopups();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPopups();
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            showAlert({
                title: 'Izin Ditolak',
                message: 'Mohon berikan izin akses galeri untuk mengunggah gambar.',
                type: 'danger',
                icon: <AlertTriangle size={28} color="#EF4444" />
            });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled) {
            setFormData(prev => ({
                ...prev,
                image: result.assets[0],
                imageUri: result.assets[0].uri
            }));
        }
    };

    const handleSave = async () => {
        if (!formData.title) {
            showAlert({ title: 'Peringatan', message: 'Tolong isi judul popup.' });
            return;
        }

        if (!editingPopup && !formData.image) {
            showAlert({ title: 'Peringatan', message: 'Tolong pilih gambar untuk popup baru.' });
            return;
        }

        setSaving(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('link_type', formData.link_type);
            formDataToSend.append('link_value', formData.link_value || '');
            formDataToSend.append('show_on_pages', JSON.stringify(formData.show_on_pages));
            formDataToSend.append('priority', String(formData.priority || 0));
            formDataToSend.append('is_active', formData.is_active ? '1' : '0');

            // Explicitly handle image removal
            if (!formData.image && (!formData.imageUri || formData.imageUri === null)) {
                formDataToSend.append('remove_image', 'true');
            }

            if (formData.image) {
                const uri = formData.image.uri;
                const uriParts = uri.split('.');
                const fileType = uriParts[uriParts.length - 1];
                formDataToSend.append('image', {
                    uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                    name: `popup_${Date.now()}.${fileType}`,
                    type: `image/${fileType}`,
                });
            }

            let response;
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };

            if (editingPopup) {
                response = await apiService.put(`/api/popups/${editingPopup.id}`, formDataToSend, config);
                if (response.data.message === 'success') {
                    showAlert({
                        title: 'Berhasil',
                        message: 'Popup berhasil diperbarui.',
                        type: 'success',
                        icon: <CheckCircle2 size={28} color="#059669" />
                    });
                }
            } else {
                response = await apiService.post('/api/popups', formDataToSend, config);
                if (response.data.message === 'success') {
                    showAlert({
                        title: 'Berhasil',
                        message: 'Popup baru telah berhasil ditambahkan.',
                        type: 'success',
                        icon: <CheckCircle2 size={28} color="#059669" />
                    });
                }
            }
            handleCloseModal();
            fetchPopups();
        } catch (error) {
            console.error('Error saving popup:', error);
            showAlert({
                title: 'Gagal Menyimpan',
                message: error.response?.data?.error || 'Terjadi kesalahan saat menyimpan data.',
                type: 'danger'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (popup) => {
        showConfirm({
            title: 'Hapus Popup',
            message: `Apakah Anda yakin ingin menghapus popup \"${popup.title}\"? Tindakan ini tidak dapat dibatalkan.`,
            type: 'danger',
            confirmText: 'Hapus Sekarang',
            icon: <Trash2 size={28} color="#EF4444" />,
            onConfirm: async () => {
                try {
                    await apiService.delete(`/api/popups/${popup.id}`);
                    showAlert({
                        title: 'Terhapus',
                        message: 'Popup telah berhasil dihapus dari sistem.',
                        type: 'success',
                        icon: <CheckCircle2 size={28} color="#059669" />
                    });
                    fetchPopups();
                } catch (error) {
                    console.error('Error deleting popup:', error);
                    showAlert({
                        title: 'Gagal Hapus',
                        message: 'Tidak dapat menghapus popup saat ini.',
                        type: 'danger'
                    });
                }
            }
        });
    };

    const handlePush = (popup) => {
        showConfirm({
            title: 'Push Ulang Popup',
            message: `Kirim ulang popup \"${popup.title}\" ke semua customer? Customer akan melihat popup ini kembali saat membuka dashboard.`,
            type: 'primary',
            confirmText: 'Push Sekarang',
            icon: <Send size={28} color="#059669" />,
            onConfirm: async () => {
                try {
                    await apiService.post(`/api/popups/${popup.id}/push`);
                    showAlert({
                        title: 'Berhasil Push',
                        message: 'Popup telah dikirim ulang ke semua customer.',
                        type: 'success',
                        icon: <CheckCircle2 size={28} color="#059669" />
                    });
                    fetchPopups();
                } catch (error) {
                    console.error('Error pushing popup:', error);
                    showAlert({
                        title: 'Gagal Push',
                        message: 'Tidak dapat mengirim ulang popup saat ini.',
                        type: 'danger'
                    });
                }
            }
        });
    };

    const togglePage = (page) => {
        setFormData(prev => {
            const pages = [...prev.show_on_pages];
            const index = pages.indexOf(page);
            if (index > -1) {
                pages.splice(index, 1);
            } else {
                pages.push(page);
            }
            return { ...prev, show_on_pages: pages };
        });
    };

    const formatCTR = (views, clicks) => {
        if (views === 0) return '0%';
        return ((clicks / views) * 100).toFixed(1) + '%';
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <ChevronLeft size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerLabel}>Seller Center</Text>
                        <Text style={styles.headerMainTitle}>Popup Promo</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => handleOpenModal()}
                    activeOpacity={0.8}
                >
                    <Plus size={24} color="#FFFFFF" strokeWidth={3} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#059669" />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Stats Summary */}
                {Array.isArray(popups) && popups.length > 0 && (
                    <View style={styles.statsSummary}>
                        <View style={styles.summaryCard}>
                            <View style={[styles.summaryIcon, { backgroundColor: '#ECFDF5' }]}>
                                <CheckCircle2 size={20} color="#059669" />
                            </View>
                            <View>
                                <Text style={styles.summaryValue}>{popups.filter(p => p.is_active).length}</Text>
                                <Text style={styles.summaryLabel}>Aktif</Text>
                            </View>
                        </View>
                        <View style={styles.summaryCard}>
                            <View style={[styles.summaryIcon, { backgroundColor: '#F0F9FF' }]}>
                                <TrendingUp size={20} color="#0284C7" />
                            </View>
                            <View>
                                <Text style={styles.summaryValue}>
                                    {popups.reduce((acc, p) => acc + (p.click_count || 0), 0)}
                                </Text>
                                <Text style={styles.summaryLabel}>Klik</Text>
                            </View>
                        </View>
                    </View>
                )}
                {!Array.isArray(popups) || popups.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <Megaphone size={64} color="#94A3B8" strokeWidth={1.5} />
                        </View>
                        <Text style={styles.emptyText}>Belum Ada Popup</Text>
                        <Text style={styles.emptySubtext}>Promo Anda akan muncul di hadapan customer dalam bentuk popup yang menarik.</Text>
                        <TouchableOpacity
                            style={styles.emptyAddBtn}
                            onPress={() => handleOpenModal()}
                        >
                            <Text style={styles.emptyAddBtnText}>Buat Popup Sekarang</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    popups.map((popup) => (
                        <View key={popup.id} style={styles.popupCard}>
                            {/* Horizontal Card Layout */}
                            <View style={styles.cardMainRow}>
                                {/* Left: Image Thumbnail */}
                                <View style={styles.cardImageContainer}>
                                    {popup.image_url ? (
                                        <Image
                                            source={{ uri: `${API_URL}${popup.image_url.startsWith('/') ? '' : '/'}${popup.image_url}` }}
                                            style={styles.popupThumbImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={styles.popupImagePlaceholder}>
                                            <ImageIcon size={24} color="#CBD5E1" />
                                        </View>
                                    )}
                                    {/* Mini Status Overlay */}
                                    <View style={[styles.miniStatusBadge, { backgroundColor: popup.is_active ? '#059669' : '#EF4444' }]}>
                                    </View>
                                </View>

                                {/* Right: Content */}
                                <View style={styles.cardDetails}>
                                    <View style={styles.titleRowCompact}>
                                        <Text style={styles.popupTitleCompact} numberOfLines={1}>{popup.title}</Text>
                                        <View style={styles.priorityBadgeCompact}>
                                            <TrendingUp size={10} color="#F59E0B" />
                                            <Text style={styles.priorityTextCompact}>{popup.priority || 0}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.tagsRowCompact}>
                                        <Text style={styles.tagTextCompact} numberOfLines={1}>
                                            {popup.show_on_pages && popup.show_on_pages.length > 0
                                                ? popup.show_on_pages.map(p => AVAILABLE_PAGES.find(ap => ap.value === p)?.label || p).join(', ')
                                                : 'Semua Halaman'}
                                        </Text>
                                    </View>

                                    {popup.last_pushed_at && (
                                        <Text style={styles.lastPushedTextCompact}>
                                            Push: {new Date(popup.last_pushed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {new Date(popup.last_pushed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    )}
                                </View>

                                {/* Edit Button (Top Right) */}
                                <TouchableOpacity
                                    style={styles.editBtnCompact}
                                    onPress={() => handleOpenModal(popup)}
                                >
                                    <Edit2 size={16} color="#64748B" />
                                </TouchableOpacity>
                            </View>

                            {/* Bottom: Stats & Actions */}
                            <View style={styles.cardFooter}>
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Eye size={12} color="#64748B" />
                                        <Text style={styles.statVal}>{popup.view_count || 0}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <MousePointer2 size={12} color="#64748B" />
                                        <Text style={styles.statVal}>{popup.click_count || 0}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <BarChart3 size={12} color="#059669" />
                                        <Text style={[styles.statVal, { color: '#059669' }]}>
                                            {formatCTR(popup.view_count, popup.click_count)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.actionsRow}>
                                    <TouchableOpacity
                                        style={styles.pushBtnSmall}
                                        onPress={() => handlePush(popup)}
                                    >
                                        <Send size={12} color="#FFFFFF" />
                                        <Text style={styles.pushBtnTextSmall}>Push</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.deleteBtnSmall}
                                        onPress={() => handleDelete(popup)}
                                    >
                                        <Trash2 size={14} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Modal Form */}
            <BottomModalTemplate
                visible={showModal}
                onClose={handleCloseModal}
                title={editingPopup ? 'Edit Popup' : 'Tambah Popup Baru'}
                heightPercentage={1}
                disableSwipe={true}
                footer={
                    <TouchableOpacity
                        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Check size={20} color="#FFFFFF" strokeWidth={3} />
                                <Text style={styles.saveBtnText}>
                                    {editingPopup ? 'SIMPAN PERUBAHAN' : 'TAMBAHKAN POPUP'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                }
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalContent}>
                        {/* Image Selection - moved to top for better flow */}
                        <View style={[styles.sectionHeader, { marginTop: 0 }]}>
                            <ImageIcon size={14} color="#64748B" />
                            <Text style={styles.sectionTitle}>MEDIA POPUP</Text>
                        </View>

                        <TouchableOpacity style={styles.uploadArea} onPress={pickImage} activeOpacity={0.8}>
                            {formData.imageUri ? (
                                <ImageBackground
                                    source={{ uri: formData.imageUri }}
                                    style={styles.uploadPreview}
                                    imageStyle={{ borderRadius: 16 }}
                                >
                                    <View style={styles.uploadOverlay}>
                                        <View style={styles.uploadActionBtn}>
                                            <Camera size={20} color="#FFFFFF" strokeWidth={2.5} />
                                        </View>
                                    </View>
                                </ImageBackground>
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <View style={styles.uploadIconCircle}>
                                        <ImageIcon size={28} color="#059669" />
                                    </View>
                                    <View style={styles.uploadTexts}>
                                        <Text style={styles.uploadTitle}>Upload Gambar</Text>
                                        <Text style={styles.uploadSubtitle}>Format PNG/JPG, Rasio 4:3</Text>
                                    </View>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Basic Info */}
                        <View style={styles.sectionHeader}>
                            <Edit2 size={14} color="#64748B" />
                            <Text style={styles.sectionTitle}>INFORMASI DASAR</Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.inputLabel}>Judul Popup</Text>
                            <TextInput
                                style={styles.textInput}
                                value={formData.title}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                                placeholder="Contoh: Promo Spesial Ramadhan"
                                placeholderTextColor="#CBD5E1"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <View style={styles.rowBetween}>
                                <Text style={styles.inputLabel}>Prioritas Tampil</Text>
                                <View style={styles.priorityHelp}>
                                    <Info size={12} color="#059669" />
                                    <Text style={styles.priorityHelpText}>Angka tinggi = Tampil duluan</Text>
                                </View>
                            </View>
                            <View style={styles.priorityInputContainer}>
                                <TrendingUp size={18} color="#64748B" style={{ marginRight: 10 }} />
                                <TextInput
                                    style={[styles.textInput, { flex: 1, borderWidth: 0, paddingHorizontal: 0, marginTop: 0 }]}
                                    value={formData.priority.toString()}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, priority: text.replace(/[^0-9]/g, '') }))}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    placeholderTextColor="#CBD5E1"
                                />
                            </View>
                        </View>

                        {/* Action Link */}
                        <View style={styles.sectionHeader}>
                            <Link2 size={14} color="#64748B" />
                            <Text style={styles.sectionTitle}>AKSI & NAVIGASI</Text>
                        </View>

                        <View style={styles.linkTypeContainer}>
                            {LINK_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.linkTypeOption,
                                        formData.link_type === type.value && styles.linkTypeActive
                                    ]}
                                    onPress={() => setFormData(prev => ({ ...prev, link_type: type.value, link_value: '' }))}
                                >
                                    <Text style={[
                                        styles.linkTypeText,
                                        formData.link_type === type.value && styles.linkTypeTextActive
                                    ]}>{type.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {formData.link_type === 'screen' && (
                            <View style={styles.screenSelectorContainer}>
                                {SCREEN_OPTIONS.map((opt) => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[
                                            styles.screenOption,
                                            formData.link_value === opt.value && styles.screenOptionActive
                                        ]}
                                        onPress={() => setFormData(prev => ({ ...prev, link_value: opt.value }))}
                                    >
                                        <View style={[
                                            styles.radioButton,
                                            formData.link_value === opt.value && styles.radioButtonActive
                                        ]}>
                                            {formData.link_value === opt.value && <View style={styles.radioInnerCircle} />}
                                        </View>
                                        <Text style={[
                                            styles.screenOptionText,
                                            formData.link_value === opt.value && styles.screenOptionTextActive
                                        ]}>{opt.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {formData.link_type === 'url' && (
                            <View style={styles.urlInputContainer}>
                                <Link2 size={18} color="#64748B" />
                                <TextInput
                                    style={styles.urlInput}
                                    value={formData.link_value}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, link_value: text }))}
                                    placeholder="https://..."
                                    keyboardType="url"
                                    autoCapitalize="none"
                                    placeholderTextColor="#CBD5E1"
                                />
                            </View>
                        )}

                        {/* Target Pages */}
                        <View style={styles.sectionHeader}>
                            <Eye size={14} color="#64748B" />
                            <Text style={styles.sectionTitle}>TARGET HALAMAN</Text>
                        </View>

                        <View style={styles.targetPagesGrid}>
                            {AVAILABLE_PAGES.map((page) => {
                                const isSelected = formData.show_on_pages.includes(page.value);
                                return (
                                    <TouchableOpacity
                                        key={page.value}
                                        style={[styles.pageChip, isSelected && styles.pageChipActive]}
                                        onPress={() => togglePage(page.value)}
                                    >
                                        <Text style={[styles.pageChipText, isSelected && styles.pageChipTextActive]}>
                                            {page.label}
                                        </Text>
                                        {isSelected && <CheckCircle2 size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <Text style={styles.helperTextSimple}>*Biarkan kosong untuk tampil di semua halaman</Text>

                        {/* Active Switch */}
                        <View style={styles.statusSwitchContainer}>
                            <View style={styles.switchLabelArea}>
                                <View style={[styles.switchIcon, { backgroundColor: formData.is_active ? '#DCFCE7' : '#F1F5F9' }]}>
                                    <Megaphone size={18} color={formData.is_active ? '#059669' : '#94A3B8'} />
                                </View>
                                <View>
                                    <Text style={styles.switchTitle}>Status Publikasi</Text>
                                    <Text style={styles.switchSub}>{formData.is_active ? 'Popup akan ditampilkan' : 'Disimpan sebagai draft'}</Text>
                                </View>
                            </View>
                            <Switch
                                value={formData.is_active}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value }))}
                                trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
                                thumbColor={formData.is_active ? '#059669' : '#FFFFFF'}
                            />
                        </View>

                        <View style={{ height: 40 }} />
                    </View>
                </KeyboardAvoidingView>
            </BottomModalTemplate>

            {/* Premium Confirm Modal */}
            <Modal
                visible={confirmConfig.visible}
                transparent={true}
                animationType="fade"
                onRequestClose={handleConfirmClose}
            >
                <View style={confirmStyles.overlay}>
                    <View style={confirmStyles.container}>
                        <View style={confirmStyles.content}>
                            <View style={[confirmStyles.iconContainer,
                            { backgroundColor: confirmConfig.type === 'danger' ? '#FEF2F2' : '#F0FDF4' }]}>
                                {confirmConfig.icon || (confirmConfig.type === 'danger' ?
                                    <AlertTriangle size={32} color="#EF4444" /> :
                                    <Info size={32} color="#059669" />)}
                            </View>
                            <Text style={confirmStyles.title}>{confirmConfig.title}</Text>
                            <Text style={confirmStyles.message}>{confirmConfig.message}</Text>
                        </View>
                        <View style={confirmStyles.footer}>
                            {!confirmConfig.isAlert && (
                                <TouchableOpacity
                                    style={confirmStyles.cancelBtn}
                                    onPress={handleConfirmClose}
                                    activeOpacity={0.7}
                                >
                                    <Text style={confirmStyles.cancelBtnText}>Batal</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[confirmStyles.confirmBtn,
                                { backgroundColor: confirmConfig.type === 'danger' ? '#EF4444' : '#059669' },
                                confirmConfig.isAlert && { flex: 1 }]}
                                onPress={handleConfirmAction}
                                activeOpacity={0.8}
                            >
                                <Text style={confirmStyles.confirmBtnText}>{confirmConfig.confirmText}</Text>
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
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : 20,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    backBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    headerTitleContainer: {
        justifyContent: 'center',
    },
    headerLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: -2,
    },
    headerMainTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    addBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#059669',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    // Beautified Management Styles
    statsSummary: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            ios: {
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    summaryIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        lineHeight: 22,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    popupCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardMainRow: {
        flexDirection: 'row',
        gap: 14, // Increased gap between image and text
        marginBottom: 14, // Increased bottom margin
    },
    cardImageContainer: {
        width: 85, // Increased from 70
        height: 85, // Increased from 70
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    popupThumbImage: {
        width: '100%',
        height: '100%',
    },
    popupImagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniStatusBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        width: 10, // Slightly larger dot
        height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    cardDetails: {
        flex: 1,
        justifyContent: 'center',
        gap: 6, // Increased vertical gap
    },
    titleRowCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    popupTitleCompact: {
        fontSize: 16, // Increased from 14
        fontWeight: '800',
        color: '#0F172A',
        flex: 1,
        lineHeight: 22, // Better line height
    },
    priorityBadgeCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8, // More horizontal padding
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    priorityTextCompact: {
        fontSize: 10, // Increased from 9
        fontWeight: '800',
        color: '#F59E0B',
    },
    tagsRowCompact: {
        flexDirection: 'row',
    },
    tagTextCompact: {
        fontSize: 12, // Increased from 11
        color: '#64748B',
        fontWeight: '600', // Increased weight
    },
    lastPushedTextCompact: {
        fontSize: 11, // Increased from 10
        color: '#94A3B8',
        fontWeight: '500',
    },
    editBtnCompact: {
        padding: 6, // Larger touch target
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        height: 32,
        width: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12, // Increased top padding
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16, // Increased gap between stats
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6, // Increased gap icon-text
    },
    statVal: {
        fontSize: 13, // Increased from 11
        fontWeight: '700',
        color: '#475569',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10, // Increased gap between buttons
    },
    pushBtnSmall: {
        backgroundColor: '#059669',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14, // Larger padding
        paddingVertical: 8, // Larger height
        borderRadius: 8,
        gap: 6,
        elevation: 1,
    },
    pushBtnTextSmall: {
        color: '#FFFFFF',
        fontSize: 11, // Increased from 10
        fontWeight: '800',
    },
    deleteBtnSmall: {
        padding: 8, // Larger padding
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginHorizontal: 4,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderStyle: 'dashed',
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 22,
    },
    emptyAddBtn: {
        marginTop: 28,
        backgroundColor: '#059669',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 100,
        elevation: 2,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    emptyAddBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
    modalContent: {
        padding: 20,
        paddingBottom: 40,
    },
    saveBtn: {
        backgroundColor: '#059669',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    saveBtnDisabled: {
        backgroundColor: '#94A3B8',
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    // Modal Styles
    modalContent: {
        paddingTop: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // Image Upload
    uploadArea: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        marginBottom: 10,
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    uploadIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadTexts: {
        alignItems: 'center',
        gap: 4,
    },
    uploadTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    uploadSubtitle: {
        fontSize: 11,
        color: '#94A3B8',
    },
    uploadPreview: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    uploadOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadActionBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Form Inputs
    formGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '500',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    priorityHelp: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 100,
    },
    priorityHelpText: {
        fontSize: 10,
        color: '#059669',
        fontWeight: '600',
    },
    priorityInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
    },

    // Link Types
    linkTypeContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        padding: 4,
        borderRadius: 12,
        marginBottom: 16,
    },
    linkTypeOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 10,
    },
    linkTypeActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    linkTypeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    linkTypeTextActive: {
        color: '#0F172A',
        fontWeight: '800',
    },

    // Screen Selector
    screenSelectorContainer: {
        gap: 8,
    },
    screenOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 12,
    },
    screenOptionActive: {
        borderColor: '#059669',
        backgroundColor: '#ECFDF5',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonActive: {
        borderColor: '#059669',
    },
    radioInnerCircle: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#059669',
    },
    screenOptionText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '500',
    },
    screenOptionTextActive: {
        color: '#059669',
        fontWeight: '700',
    },

    // URL Input
    urlInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    urlInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 14,
        color: '#1E293B',
    },

    // Target Pages Grid
    targetPagesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pageChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 100,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
    },
    pageChipActive: {
        backgroundColor: '#059669',
        borderColor: '#059669',
    },
    pageChipText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    pageChipTextActive: {
        color: '#FFFFFF',
    },
    helperTextSimple: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 8,
        fontStyle: 'italic',
    },

    // Status Switch
    statusSwitchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginTop: 24,
    },
    switchLabelArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    switchIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    switchTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
    },
    switchSub: {
        fontSize: 11,
        color: '#64748B',
    },
});

const confirmStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 15,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    content: {
        padding: 30,
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 10,
    },
    message: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        paddingTop: 0,
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#64748B',
    },
    confirmBtn: {
        flex: 1.5,
        paddingVertical: 14,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default PopupManagement;
