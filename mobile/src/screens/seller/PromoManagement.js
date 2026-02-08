import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
    RefreshControl,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Ticket,
    Plus,
    Trash2,
    Edit2,
    ChevronLeft,
    Calendar,
    Hash,
    Type,
    CheckCircle2,
    XCircle,
    Palette,
    Banknote,
    Percent
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../api/apiService';

const PromoManagement = ({ navigation }) => {
    const { token } = useAuth();
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [form, setForm] = useState({
        title: '',
        description: '',
        code: '',
        icon: 'Ticket',
        color: '#059669',
        expiry: '',
        is_active: true,
        discount_value: '',
        discount_type: 'fixed'
    });

    useEffect(() => {
        fetchPromos();
    }, []);

    const fetchPromos = async () => {
        try {
            setLoading(true);
            const response = await apiService.get('/api/promos');
            if (response.data && response.data.data) {
                setPromos(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching promos:', error);
            Alert.alert('Error', 'Gagal mengambil data promo');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPromos();
    };

    const handleOpenModal = (promo = null) => {
        if (promo) {
            setEditingPromo(promo);
            setForm({
                title: promo.title,
                description: promo.description || '',
                code: promo.code || '',
                icon: promo.icon || 'Ticket',
                color: promo.color || '#059669',
                expiry: promo.expiry || '',
                is_active: !!promo.is_active,
                discount_value: promo.discount_value?.toString() || '',
                discount_type: promo.discount_type || 'fixed'
            });
        } else {
            setEditingPromo(null);
            setForm({
                title: '',
                description: '',
                code: '',
                icon: 'Ticket',
                color: '#059669',
                expiry: '',
                is_active: true,
                discount_value: '',
                discount_type: 'fixed'
            });
        }
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        if (!form.title) {
            Alert.alert('Peringatan', 'Judul promo wajib diisi');
            return;
        }

        try {
            if (editingPromo) {
                await apiService.put(`/api/promos/${editingPromo.id}`, form);
                Alert.alert('Sukses', 'Promo berhasil diperbarui');
            } else {
                await apiService.post('/api/promos', form);
                Alert.alert('Sukses', 'Promo baru berhasil ditambahkan');
            }
            setModalVisible(false);
            fetchPromos();
        } catch (error) {
            console.error('Error submitting promo:', error);
            const msg = error.response?.data?.error || 'Gagal menyimpan promo';
            Alert.alert('Error', msg);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Konfirmasi Hapus',
            'Apakah Anda yakin ingin menghapus promo ini?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiService.delete(`/api/promos/${id}`);
                            fetchPromos();
                        } catch (error) {
                            Alert.alert('Error', 'Gagal menghapus promo');
                        }
                    }
                }
            ]
        );
    };

    const toggleStatus = async (promo) => {
        try {
            const newStatus = !promo.is_active;
            await apiService.put(`/api/promos/${promo.id}`, {
                ...promo,
                is_active: newStatus
            });
            fetchPromos();
        } catch (error) {
            Alert.alert('Error', 'Gagal mengubah status promo');
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Manajemen Promo</Text>
                    <Text style={styles.headerSubtitle}>Kelola Voucher & Kampanye</Text>
                </View>
                <TouchableOpacity style={styles.addBtnHeader} onPress={() => handleOpenModal()}>
                    <Plus size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {promos.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ticket size={64} color="#D1D5DB" />
                        <Text style={styles.emptyText}>Belum ada promo aktif</Text>
                        <TouchableOpacity style={styles.emptyAddBtn} onPress={() => handleOpenModal()}>
                            <Text style={styles.emptyAddBtnText}>Buat Promo Pertama</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    promos.map((promo) => (
                        <View key={promo.id} style={styles.promoCard}>
                            <View style={[styles.promoIconContainer, { backgroundColor: promo.color + '20' }]}>
                                <Ticket size={24} color={promo.color} />
                            </View>

                            <View style={styles.promoInfo}>
                                <Text style={styles.promoTitle}>{promo.title}</Text>
                                {promo.code ? (
                                    <View style={styles.codeBadge}>
                                        <Hash size={12} color="#4B5563" />
                                        <Text style={styles.promoCode}>{promo.code}</Text>
                                    </View>
                                ) : null}
                                <Text style={styles.promoExpiry}>Berlaku: {promo.expiry || 'Selamanya'}</Text>
                                <Text style={styles.promoDiscount}>
                                    Potongan: {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `Rp ${parseFloat(promo.discount_value).toLocaleString('id-ID')}`}
                                </Text>
                            </View>

                            <View style={styles.promoActions}>
                                <TouchableOpacity
                                    style={styles.statusToggle}
                                    onPress={() => toggleStatus(promo)}
                                >
                                    {promo.is_active ? (
                                        <CheckCircle2 size={20} color="#059669" />
                                    ) : (
                                        <XCircle size={20} color="#EF4444" />
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenModal(promo)}>
                                    <Edit2 size={20} color="#3B82F6" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(promo.id)}>
                                    <Trash2 size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Float Button */}
            {promos.length > 0 && (
                <TouchableOpacity style={styles.fab} onPress={() => handleOpenModal()}>
                    <Plus size={28} color="#FFFFFF" />
                </TouchableOpacity>
            )}

            {/* Modal Form */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingPromo ? 'Edit Promo' : 'Tambah Promo Baru'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <XCircle size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContainer}>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelContainer}>
                                    <Type size={16} color="#6B7280" />
                                    <Text style={styles.inputLabel}>Judul Promo</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Contoh: Diskon Akhir Tahun"
                                    value={form.title}
                                    onChangeText={(text) => setForm({ ...form, title: text })}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelContainer}>
                                    <Hash size={16} color="#6B7280" />
                                    <Text style={styles.inputLabel}>Kode Promo (Opsional)</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Contoh: HEMAT88"
                                    value={form.code}
                                    onChangeText={(text) => setForm({ ...form, code: text })}
                                    autoCapitalize="characters"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelContainer}>
                                    <Calendar size={16} color="#6B7280" />
                                    <Text style={styles.inputLabel}>Masa Berlaku</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Contoh: s/d 31 Des 2026"
                                    value={form.expiry}
                                    onChangeText={(text) => setForm({ ...form, expiry: text })}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelContainer}>
                                    <Banknote size={16} color="#6B7280" />
                                    <Text style={styles.inputLabel}>Nominal / Nilai Promo</Text>
                                </View>
                                <View style={styles.discountTypeContainer}>
                                    <TouchableOpacity
                                        style={[styles.typeBtn, form.discount_type === 'fixed' && styles.typeBtnActive]}
                                        onPress={() => setForm({ ...form, discount_type: 'fixed' })}
                                    >
                                        <Banknote size={16} color={form.discount_type === 'fixed' ? '#FFFFFF' : '#6B7280'} />
                                        <Text style={[styles.typeBtnText, form.discount_type === 'fixed' && styles.typeBtnTextActive]}>Rp (Tetap)</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.typeBtn, form.discount_type === 'percentage' && styles.typeBtnActive]}
                                        onPress={() => setForm({ ...form, discount_type: 'percentage' })}
                                    >
                                        <Percent size={16} color={form.discount_type === 'percentage' ? '#FFFFFF' : '#6B7280'} />
                                        <Text style={[styles.typeBtnText, form.discount_type === 'percentage' && styles.typeBtnTextActive]}>% (Persen)</Text>
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder={form.discount_type === 'fixed' ? "Masukkan nominal Rp..." : "Masukkan persen (1-100)..."}
                                    value={form.discount_value}
                                    onChangeText={(text) => setForm({ ...form, discount_value: text })}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelContainer}>
                                    <Palette size={16} color="#6B7280" />
                                    <Text style={styles.inputLabel}>Warna Tema</Text>
                                </View>
                                <View style={styles.colorPicker}>
                                    {['#059669', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'].map((c) => (
                                        <TouchableOpacity
                                            key={c}
                                            style={[
                                                styles.colorOption,
                                                { backgroundColor: c },
                                                form.color === c && styles.selectedColor
                                            ]}
                                            onPress={() => setForm({ ...form, color: c })}
                                        >
                                            {form.color === c && <CheckCircle2 size={16} color="#FFFFFF" />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Keterangan / Detail</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Jelaskan detail promo..."
                                    value={form.description}
                                    onChangeText={(text) => setForm({ ...form, description: text })}
                                    multiline={true}
                                    numberOfLines={4}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.submitBtn, { backgroundColor: form.color }]}
                                onPress={handleSubmit}
                            >
                                <Text style={styles.submitBtnText}>Simpan Promo</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backBtn: {
        padding: 5,
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    addBtnHeader: {
        backgroundColor: '#059669',
        borderRadius: 10,
        padding: 8,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    promoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    promoIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    promoInfo: {
        flex: 1,
        marginLeft: 15,
    },
    promoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    codeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 4,
        gap: 4,
    },
    promoCode: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4B5563',
    },
    promoExpiry: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    promoActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusToggle: {
        padding: 5,
    },
    actionBtn: {
        padding: 5,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#059669',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 15,
    },
    emptyAddBtn: {
        marginTop: 20,
        backgroundColor: '#059669',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    emptyAddBtnText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '85%',
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    formContainer: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1F2937',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    colorPicker: {
        flexDirection: 'row',
        gap: 12,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedColor: {
        borderWidth: 3,
        borderColor: '#E5E7EB',
    },
    submitBtn: {
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 40,
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    promoDiscount: {
        fontSize: 12,
        fontWeight: '700',
        color: '#059669',
        marginTop: 2,
    },
    discountTypeContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    typeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    typeBtnActive: {
        backgroundColor: '#059669',
        borderColor: '#059669',
    },
    typeBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    typeBtnTextActive: {
        color: '#FFFFFF',
    },
});

export default PromoManagement;
