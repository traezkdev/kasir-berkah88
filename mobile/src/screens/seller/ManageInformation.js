import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Trash2, Image as ImageIcon, Send, X, Camera, CheckCircle2, BellOff, Edit2, Link2, ExternalLink, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import apiService, { API_URL } from '../../api/apiService';
import BottomModalTemplate from '../../components/templates/BottomModalTemplate';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';

const ManageInformation = ({ navigation }) => {
    const [infos, setInfos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form states
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const { showToast } = useToast();
    const [imagePickerTrigger, setImagePickerTrigger] = useState(null); // 'camera' or 'gallery'
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingInfo, setPendingInfo] = useState(null);

    // Link states
    const [linkType, setLinkType] = useState('none'); // 'none', 'product'
    const [linkValue, setLinkValue] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [selectedProductName, setSelectedProductName] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    const fetchInfos = async (page = 1) => {
        setIsLoading(true);
        try {
            const res = await apiService.get(`/api/information?page=${page}&limit=${itemsPerPage}`);
            if (res.data.data) {
                setInfos(res.data.data);
                if (res.data.pagination) {
                    setCurrentPage(res.data.pagination.currentPage);
                    setTotalPages(res.data.pagination.totalPages);
                    setTotalItems(res.data.pagination.totalItems);
                }
            }
        } catch (error) {
            console.error('Error fetching information:', error);
            showToast('Gagal mengambil data informasi', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMenuItems = async () => {
        try {
            const res = await apiService.get('/api/menu-items');
            if (res.data && res.data.data) {
                setMenuItems(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching menu items:', error);
        }
    };

    useEffect(() => {
        fetchInfos();
        fetchMenuItems();
    }, []);

    // Effect to handle image picker after modal is closed (to avoid Android conflicts)
    useEffect(() => {
        if (!showImageModal && imagePickerTrigger) {
            const timer = setTimeout(() => {
                if (imagePickerTrigger === 'camera') {
                    executeCamera();
                } else if (imagePickerTrigger === 'gallery') {
                    executeGallery();
                }
                setImagePickerTrigger(null);
            }, 500); // 500ms delay to ensure modal is fully dismissed
            return () => clearTimeout(timer);
        }
    }, [showImageModal, imagePickerTrigger]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Izin Ditolak', 'Maaf, kami butuh izin galeri untuk mengunggah gambar.');
            return;
        }
        setShowImageModal(true);
    };

    const handleCamera = () => {
        setShowImageModal(false);
        setImagePickerTrigger('camera');
    };

    const handleGallery = () => {
        setShowImageModal(false);
        setImagePickerTrigger('gallery');
    };

    const executeCamera = async () => {
        try {
            const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraStatus.status !== 'granted') {
                Alert.alert('Izin Ditolak', 'Maaf, kami butuh izin kamera.');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.7,
                base64: true,
            });
            if (!result.canceled) {
                setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Error', 'Gagal membuka kamera');
        }
    };

    const executeGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'], // Updated from deprecated MediaTypeOptions
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.7,
                base64: true,
            });
            if (!result.canceled) {
                setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
            }
        } catch (error) {
            console.error('Gallery error:', error);
            Alert.alert('Error', 'Gagal membuka galeri');
        }
    };

    const removeImage = () => {
        setImage(null);
    };

    const handleSubmit = async () => {
        if (!title || !content) {
            showToast('Judul dan isi informasi wajib diisi', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                await apiService.put(`/api/information/${editingId}`, {
                    title,
                    content,
                    image_url: image,
                    link_type: linkType,
                    link_value: linkValue
                });
                showToast('Informasi berhasil diperbarui!', 'success');
            } else {
                await apiService.post('/api/information', {
                    title,
                    content,
                    image_url: image,
                    link_type: linkType,
                    link_value: linkValue
                });
                showToast('Informasi berhasil disimpan!', 'success');
            }

            setTitle('');
            setContent('');
            setImage(null);
            setLinkType('none');
            setLinkValue(null);
            setSelectedProductName('');
            setEditingId(null);
            setShowForm(false);
            // Kembali ke halaman 1 jika menambah data baru, tetap di halaman saat ini jika edit
            fetchInfos(editingId ? currentPage : 1);
        } catch (error) {
            console.error('Error submitting information:', error);
            showToast(error.response?.data?.error || 'Gagal menyimpan informasi', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (info) => {
        setEditingId(info.id);
        setTitle(info.title);
        setContent(info.content);
        setImage(info.image_url ? info.image_url : null);
        setLinkType(info.link_type || 'none');
        setLinkValue(info.link_value);

        if (info.link_type === 'product' && info.link_value) {
            const product = menuItems.find(m => m.id === info.link_value);
            setSelectedProductName(product ? product.name : 'Produk tidak ditemukan');
        } else {
            setSelectedProductName('');
        }

        setShowForm(true);
        // Scroll to top to see the form
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setTitle('');
        setContent('');
        setImage(null);
        setLinkType('none');
        setLinkValue(null);
        setSelectedProductName('');
        setShowForm(false);
    };

    const scrollViewRef = React.useRef(null);

    const handleDelete = (id) => {
        Alert.alert(
            'Konfirmasi Hapus',
            'Apakah Anda yakin ingin menghapus informasi ini?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiService.delete(`/api/information/${id}`);
                            // Tetap di halaman saat ini, kecuali jika halaman tersebut menjadi kosong
                            const newTotalItems = totalItems - 1;
                            const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
                            const targetPage = currentPage > newTotalPages ? newTotalPages : currentPage;
                            fetchInfos(targetPage || 1);
                        } catch (error) {
                            Alert.alert('Error', 'Gagal menghapus informasi');
                        }
                    }
                }
            ]
        );
    };

    const handleBroadcast = (info) => {
        setPendingInfo(info);
        setShowConfirmModal(true);
    };

    const executeBroadcast = async () => {
        if (!pendingInfo) return;
        setShowConfirmModal(false);
        try {
            await apiService.post(`/api/information/${pendingInfo.id}/broadcast`);
            showToast(`Berhasil mengirim ulang notifikasi "${pendingInfo.title}"`, 'success');
        } catch (error) {
            console.error('Broadcast error:', error);
            showToast('Gagal mengirim broadcast', 'error');
        } finally {
            setPendingInfo(null);
        }
    };

    return (
        <>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <ChevronLeft size={24} color="#1E293B" />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerLabel}>Pusat</Text>
                            <Text style={styles.headerMainTitle}>Informasi</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.addBtn, showForm && styles.addBtnActive]}
                        onPress={() => {
                            if (showForm) {
                                if (editingId) {
                                    cancelEdit();
                                } else {
                                    setShowForm(false);
                                }
                            } else {
                                setShowForm(true);
                            }
                        }}
                    >
                        {showForm ? (
                            <X size={24} color="#FFFFFF" />
                        ) : (
                            <Plus size={24} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContentContainer}
                    >
                        {/* Information form moved to BottomModalTemplate */}

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Riwayat Terbitan</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{totalItems} Total</Text>
                            </View>
                        </View>

                        {isLoading ? (
                            <View style={styles.loaderContainer}>
                                <ActivityIndicator size="large" color="#6366F1" />
                                <Text style={styles.loaderText}>Menyinkronkan data...</Text>
                            </View>
                        ) : infos.length > 0 ? (
                            infos.map((info) => (
                                <View key={info.id} style={styles.premiumCard}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.cardImageContainer}>
                                            {info.image_url ? (
                                                <Image
                                                    source={{ uri: `${API_URL}${info.image_url}` }}
                                                    style={styles.cardImage}
                                                />
                                            ) : (
                                                <View style={styles.cardImagePlaceholder}>
                                                    <BellOff size={24} color="#CBD5E1" />
                                                </View>
                                            )}
                                            <View style={styles.dateBadge}>
                                                <Text style={styles.dateBadgeText}>
                                                    {new Date(info.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.cardBody}>
                                            <Text style={styles.cardTitle} numberOfLines={1}>{info.title}</Text>
                                            <Text style={styles.cardExcerpt} numberOfLines={2}>
                                                {info.content}
                                            </Text>
                                            {info.link_type === 'product' && (
                                                <View style={styles.cardLinkTag}>
                                                    <ExternalLink size={10} color="#6366F1" />
                                                    <Text style={styles.cardLinkText}>Tautan: Produk</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    <View style={styles.cardFooter}>
                                        <TouchableOpacity
                                            style={styles.footerStats}
                                            onPress={() => handleBroadcast(info)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[styles.statItem, { backgroundColor: '#EEF2FF' }]}>
                                                <Send size={12} color="#6366F1" />
                                                <Text style={[styles.statText, { color: '#6366F1' }]}>Broadcast Lagi</Text>
                                            </View>
                                        </TouchableOpacity>
                                        <View style={styles.cardActions}>
                                            <TouchableOpacity
                                                style={styles.modernActionBtn}
                                                onPress={() => handleEdit(info)}
                                            >
                                                <Edit2 size={16} color="#6366F1" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.modernActionBtn, styles.deleteActionBtn]}
                                                onPress={() => handleDelete(info.id)}
                                            >
                                                <Trash2 size={16} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyContent}>
                                <View style={styles.emptyIllustration}>
                                    <View style={styles.emptyCircleLarge} />
                                    <View style={styles.emptyCircleSmall} />
                                    <BellOff size={80} color="#E2E8F0" />
                                </View>
                                <Text style={styles.emptyTitle}>Lini Masa Kosong</Text>
                                <Text style={styles.emptySub}>Belum ada pengumuman yang dikirimkan ke pelanggan.</Text>
                                {!showForm && (
                                    <TouchableOpacity
                                        style={styles.emptyActionBtn}
                                        onPress={() => setShowForm(true)}
                                    >
                                        <Text style={styles.emptyActionBtnText}>Mulai Buat Pertama</Text>
                                        <Plus size={18} color="#FFFFFF" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Pagination Controls */}
                        {!isLoading && totalPages > 1 && (
                            <View style={styles.paginationContainer}>
                                <TouchableOpacity
                                    style={[styles.paginationBtn, currentPage === 1 && styles.paginationBtnDisabled]}
                                    onPress={() => {
                                        if (currentPage > 1) {
                                            fetchInfos(currentPage - 1);
                                        }
                                    }}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={18} color={currentPage === 1 ? '#CBD5E1' : '#6366F1'} />
                                    <Text style={[styles.paginationBtnText, currentPage === 1 && styles.paginationBtnTextDisabled]}>Sebelumnya</Text>
                                </TouchableOpacity>

                                <View style={styles.paginationInfo}>
                                    <Text style={styles.paginationText}>
                                        Halaman <Text style={styles.paginationTextBold}>{currentPage}</Text> dari <Text style={styles.paginationTextBold}>{totalPages}</Text>
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={[styles.paginationBtn, currentPage === totalPages && styles.paginationBtnDisabled]}
                                    onPress={() => {
                                        if (currentPage < totalPages) {
                                            fetchInfos(currentPage + 1);
                                        }
                                    }}
                                    disabled={currentPage === totalPages}
                                >
                                    <Text style={[styles.paginationBtnText, currentPage === totalPages && styles.paginationBtnTextDisabled]}>Selanjutnya</Text>
                                    <ChevronRight size={18} color={currentPage === totalPages ? '#CBD5E1' : '#6366F1'} />
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </KeyboardAvoidingView>

                <BottomModalTemplate
                    visible={showImageModal}
                    onClose={() => setShowImageModal(false)}
                    title="Pilih Sumber Gambar"
                    heightPercentage={0.4}
                >
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={handleCamera}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.modalIconContainer, { backgroundColor: '#EEF2FF' }]}>
                                <Camera size={28} color="#4F46E5" />
                            </View>
                            <Text style={styles.modalOptionText}>Kamera</Text>
                            <Text style={styles.modalOptionSub}>Ambil foto langsung</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={handleGallery}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.modalIconContainer, { backgroundColor: '#F0FDF4' }]}>
                                <ImageIcon size={28} color="#16A34A" />
                            </View>
                            <Text style={styles.modalOptionText}>Galeri</Text>
                            <Text style={styles.modalOptionSub}>Pilih dari galeri hp</Text>
                        </TouchableOpacity>
                    </View>
                </BottomModalTemplate>

                {/* Product Picker Modal */}
                <BottomModalTemplate
                    visible={showProductPicker}
                    onClose={() => setShowProductPicker(false)}
                    title="Pilih Produk Menu"
                    heightPercentage={0.7}
                >
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.productList}>
                            {menuItems?.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.productItem, linkValue === item.id && styles.productItemActive]}
                                    onPress={() => {
                                        setLinkValue(item.id);
                                        setSelectedProductName(item.name);
                                        setShowProductPicker(false);
                                    }}
                                >
                                    <View style={styles.productItemLeft}>
                                        {item.image_url ? (
                                            <Image source={{ uri: `${API_URL}${item.image_url}` }} style={styles.productItemImage} />
                                        ) : (
                                            <View style={styles.productItemImagePlaceholder}>
                                                <ImageIcon size={16} color="#CBD5E1" />
                                            </View>
                                        )}
                                        <View>
                                            <Text style={styles.productItemName}>{item.name}</Text>
                                            <Text style={styles.productItemPrice}>Rp {parseFloat(item.price).toLocaleString('id-ID')}</Text>
                                        </View>
                                    </View>
                                    {linkValue === item.id && <CheckCircle2 size={20} color="#6366F1" />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </BottomModalTemplate>

                <ConfirmDialog
                    visible={showConfirmModal}
                    title="Kirim Ulang Notifikasi"
                    message={`Apakah Anda ingin mengirimkan ulang notifikasi "${pendingInfo?.title}" ke semua pelanggan?`}
                    onConfirm={executeBroadcast}
                    onCancel={() => {
                        setShowConfirmModal(false);
                        setPendingInfo(null);
                    }}
                    confirmText="Kirim Sekarang"
                    type="info"
                />

                <BottomModalTemplate
                    visible={showForm}
                    onClose={cancelEdit}
                    title={editingId ? 'Edit Informasi' : 'Buat Informasi Baru'}
                    heightPercentage={0.85}
                    footer={
                        <TouchableOpacity
                            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                            activeOpacity={0.9}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <View style={styles.submitBtnContent}>
                                    <Text style={styles.submitBtnText}>
                                        {editingId ? 'SIMPAN PERUBAHAN' : 'TERBITKAN SEKARANG'}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    }
                >
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 20 }}>
                        <View style={styles.formHeader}>
                            <View>
                                <Text style={styles.formTitle}>
                                    {editingId ? 'Pembaruan Data' : 'Pengumuman Baru'}
                                </Text>
                                <Text style={styles.formSub}>Isi detail informasi di bawah ini</Text>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Judul Menarik</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Contoh: Promo Spesial Akhir Pekan!"
                                value={title}
                                onChangeText={setTitle}
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Isi Pengumuman</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Tuliskan detail informasi Anda di sini..."
                                multiline
                                numberOfLines={4}
                                value={content}
                                onChangeText={setContent}
                                textAlignVertical="top"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Tautan (Opsional)</Text>
                            <View style={styles.linkSelector}>
                                <TouchableOpacity
                                    style={[styles.linkTypeBtn, linkType === 'none' && styles.linkTypeBtnActive]}
                                    onPress={() => {
                                        setLinkType('none');
                                        setLinkValue(null);
                                        setSelectedProductName('');
                                    }}
                                >
                                    <Text style={[styles.linkTypeBtnText, linkType === 'none' && styles.linkTypeBtnTextActive]}>Tanpa Tautan</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.linkTypeBtn, linkType === 'product' && styles.linkTypeBtnActive]}
                                    onPress={() => setLinkType('product')}
                                >
                                    <Text style={[styles.linkTypeBtnText, linkType === 'product' && styles.linkTypeBtnTextActive]}>Pilih Menu</Text>
                                </TouchableOpacity>
                            </View>

                            {linkType === 'product' && (
                                <TouchableOpacity
                                    style={styles.productPickerTrigger}
                                    onPress={() => setShowProductPicker(true)}
                                >
                                    <View style={styles.productPickerContent}>
                                        <Link2 size={18} color="#6366F1" />
                                        <Text style={[styles.productPickerText, !selectedProductName && { color: '#94A3B8' }]}>
                                            {selectedProductName || 'Klik untuk memilih produk...'}
                                        </Text>
                                    </View>
                                    <ChevronLeft size={20} color="#94A3B8" style={{ transform: [{ rotate: '270deg' }] }} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <Text style={styles.inputLabel}>Visual Banner</Text>
                        <View style={styles.imagePickerContainer}>
                            {image ? (
                                <View style={styles.imagePreviewContainer}>
                                    <Image
                                        source={{ uri: image.startsWith('data:') ? image : `${API_URL}${image}` }}
                                        style={styles.previewImage}
                                    />
                                    <View style={styles.imageOverlay}>
                                        <TouchableOpacity style={styles.changeImageBtn} onPress={pickImage}>
                                            <Edit2 size={16} color="#FFFFFF" />
                                            <Text style={styles.changeImageText}>Ganti</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
                                            <Trash2 size={16} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                                    <View style={styles.imagePlaceholder}>
                                        <View style={styles.iconCircle}>
                                            <ImageIcon size={28} color="#6366F1" />
                                        </View>
                                        <Text style={styles.imagePlaceholderText}>Unggah Banner Menarik</Text>
                                        <Text style={styles.imagePlaceholderSub}>Format: JPG, PNG (Rasio 16:9)</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>
                </BottomModalTemplate>
            </SafeAreaView>
        </>
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
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTitleContainer: {
        justifyContent: 'center',
    },
    headerLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerMainTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
        marginTop: -2,
    },
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBtnActive: {
        backgroundColor: '#EF4444',
    },
    content: {
        flex: 1,
    },
    scrollContentContainer: {
        padding: 20,
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 24,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    formIndicator: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 25,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    formSub: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    cancelChip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#FEF2F2',
        borderRadius: 10,
    },
    cancelChipText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '800',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: '#475569',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    textArea: {
        height: 120,
    },
    imagePickerContainer: {
        marginBottom: 25,
    },
    imagePicker: {
        width: '100%',
        height: 160,
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    imagePlaceholderText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '800',
    },
    imagePlaceholderSub: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 4,
    },
    imagePreviewContainer: {
        width: '100%',
        height: 180,
        borderRadius: 22,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 15,
    },
    changeImageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        gap: 8,
    },
    changeImageText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },
    removeImageBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitBtn: {
        backgroundColor: '#1E293B',
        height: 64,
        borderRadius: 22,
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    submitBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    submitIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitBtnDisabled: {
        opacity: 0.6,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    badge: {
        backgroundColor: '#E0F2FE',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#0369A1',
    },
    loaderContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loaderText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },
    premiumCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        padding: 16,
        gap: 16,
    },
    cardImageContainer: {
        position: 'relative',
    },
    cardImage: {
        width: 70,
        height: 70,
        borderRadius: 16,
    },
    cardImagePlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    dateBadge: {
        position: 'absolute',
        bottom: -8,
        left: '50%',
        marginLeft: -25,
        backgroundColor: '#1E293B',
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 8,
        width: 50,
        alignItems: 'center',
    },
    dateBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    cardBody: {
        flex: 1,
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 4,
    },
    cardExcerpt: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
    },
    footerStats: {
        flexDirection: 'row',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#F8FAFC',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    statText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94A3B8',
        textTransform: 'uppercase',
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    modernActionBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteActionBtn: {
        backgroundColor: '#FEF2F2',
    },
    emptyContent: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIllustration: {
        position: 'relative',
        marginBottom: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyCircleLarge: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#F1F5F9',
        position: 'absolute',
    },
    emptyCircleSmall: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E2E8F0',
        position: 'absolute',
        opacity: 0.5,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 20,
        marginBottom: 30,
    },
    emptyActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 18,
        gap: 10,
    },
    emptyActionBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
    },
    modalContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 10,
    },
    modalOption: {
        alignItems: 'center',
        width: '45%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    modalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalOptionText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
    },
    modalOptionSub: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 4,
    },
    successPanel: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    successRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    successMainTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
    },
    successMainSub: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 22,
        marginBottom: 30,
    },
    confirmBtn: {
        backgroundColor: '#1E293B',
        width: '100%',
        height: 56,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },
    linkSelector: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    linkTypeBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    linkTypeBtnActive: {
        borderColor: '#6366F1',
        backgroundColor: '#EEF2FF',
    },
    linkTypeBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#64748B',
    },
    linkTypeBtnTextActive: {
        color: '#6366F1',
    },
    productPickerTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    productPickerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    productPickerText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    productList: {
        paddingHorizontal: 10,
        paddingVertical: 16,
        backgroundColor: '#F8FAFC',
    },
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    productItemActive: {
        borderColor: '#6366F1',
        backgroundColor: '#F5F7FF',
    },
    productItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    productItemImage: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    productItemImagePlaceholder: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderDashArray: [4, 4],
        borderColor: '#CBD5E1',
    },
    productItemName: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 2,
    },
    productItemPrice: {
        fontSize: 13,
        color: '#6366F1',
        fontWeight: '900',
    },
    cardLinkTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 6,
    },
    cardLinkText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#6366F1',
    },
    // Pagination Styles
    paginationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 24,
        paddingHorizontal: 4,
    },
    paginationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#EEF2FF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    paginationBtnDisabled: {
        backgroundColor: '#F8FAFC',
        borderColor: '#F1F5F9',
    },
    paginationBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#6366F1',
    },
    paginationBtnTextDisabled: {
        color: '#CBD5E1',
    },
    paginationInfo: {
        paddingHorizontal: 12,
    },
    paginationText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    paginationTextBold: {
        fontWeight: '900',
        color: '#1E293B',
    }
});

export default ManageInformation;
